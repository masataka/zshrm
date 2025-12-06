import { readHistory, writeHistory, type HistoryEntry } from "./history.ts";
import { readKeys } from "./keypress.ts";

export async function runUI(historyPath: string, query?: string) {
  const allEntries = await readHistory(historyPath);
  let entries = allEntries;
  
  if (query) {
    entries = allEntries.filter(e => e.command.includes(query));
  }

  // State
  let cursor = entries.length - 1; // Start at the bottom (latest)
  if (cursor < 0) cursor = 0;
  
  const selectedIndices = new Set<number>();
  
  let pageSize = 20;
  try {
      const { rows } = Deno.consoleSize();
      // Adjust for header (2 lines) and footer (2 lines) and some padding
      pageSize = Math.max(5, rows - 5);
  } catch {
      // Fallback if consoleSize is not available
  }
  
  const encoder = new TextEncoder();

  // Enter alternate screen & hide cursor
  await Deno.stdout.write(encoder.encode("\x1b[?1049h\x1b[?25l"));

  const render = async () => {
    // Clear screen and move to top-left
    await Deno.stdout.write(encoder.encode("\x1b[2J\x1b[H"));
    console.log("zshrm UI - Select commands to delete (Space: toggle, Enter: delete, q: quit)\n");
    
    // Calculate scroll window
    let start = cursor - Math.floor(pageSize / 2);
    if (start < 0) start = 0;
    let end = start + pageSize;
    if (end > entries.length) {
        end = entries.length;
        start = Math.max(0, end - pageSize);
    }
    // Adjust start if end is clipped but we have space above
    if (end - start < pageSize && entries.length >= pageSize) {
        start = entries.length - pageSize;
    }

    for (let i = start; i < end; i++) {
        // ... (rendering logic remains mostly same, just ensure we print enough lines)
      const entry = entries[i];
      const isSelected = selectedIndices.has(i);
      const isCursor = i === cursor;
      
      const prefix = isCursor ? ">" : " ";
      const mark = isSelected ? "[x]" : "[ ]";
      const time = entry.timestamp ? new Date(entry.timestamp * 1000).toLocaleString() : "";
      
      console.log(`${prefix} ${mark} ${time} ${entry.command.slice(0, 60)}`);
    }
    
    console.log(`\nSelected: ${selectedIndices.size} / Total: ${entries.length}`);
  };

  try {
    await render();

    for await (const key of readKeys()) {
        if (key.name === "q" || (key.ctrl && key.name === "c")) {
        break;
        }
        
        if (key.name === "up") {
        cursor--;
        if (cursor < 0) cursor = 0;
        await render();
        }
        
        if (key.name === "down") {
        cursor++;
        if (cursor >= entries.length) cursor = entries.length - 1;
        await render();
        }
        
        if (key.name === "space") {
            if (selectedIndices.has(cursor)) {
                selectedIndices.delete(cursor);
            } else {
                selectedIndices.add(cursor);
            }
            await render();
        }
        
        if (key.name === "return") {
            if (selectedIndices.size === 0) {
                // Flash message or just break?
                break;
            }

            // Temporarily exit alt screen for prompt? 
            // Or implement prompt in TUI? Let's use simple confirm in TUI context or exit and prompt.
            // For a "vi-like" feel, usually we stay in TUI. 
            // But 'prompt()' writes to stdout/stdin directly.
            // Let's rely on cleaning up, printing summary, then asking?
            // User requested "vi-like", so staying in TUI is better, but implementing a TUI prompt is complex.
            // Let's try: Exit alt screen -> Prompt -> Delete -> Done.
            
            // Actually, best flow:
            // 1. Leave Alt Screen
            // 2. Show summary & Prompt
            // 3. Do action
            // 4. Exit
            break; 
        }
    }
  } finally {
    // Leave alternate screen & show cursor
    await Deno.stdout.write(encoder.encode("\x1b[?1049l\x1b[?25h"));
  }

  // Post-UI logic (Delete confirmation)
  if (selectedIndices.size > 0) {
      const confirm = prompt(`\nDelete ${selectedIndices.size} commands? (y/N)`);
      if (confirm?.toLowerCase() === "y") {
          const toRemove = new Set<HistoryEntry>();
          for (const index of selectedIndices) {
              toRemove.add(entries[index]);
          }
          const newHistory = allEntries.filter(e => !toRemove.has(e));
          await writeHistory(historyPath, newHistory);
          console.log("Updated history.");
      } else {
          console.log("Cancelled.");
      }
  } else {
      console.log("No commands selected.");
  }
}

