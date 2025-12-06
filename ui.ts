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
  const pageSize = 10; // Number of lines to show

  // Helper to render
  const render = () => {
    console.clear();
    console.log("zshrm UI - Select commands to delete (Space: toggle, Enter: delete, q: quit)\n");
    
    // Calculate scroll window
    // Keep cursor in middle if possible
    let start = cursor - Math.floor(pageSize / 2);
    if (start < 0) start = 0;
    let end = start + pageSize;
    if (end > entries.length) {
        end = entries.length;
        start = Math.max(0, end - pageSize);
    }

    for (let i = start; i < end; i++) {
      const entry = entries[i];
      const isSelected = selectedIndices.has(i);
      const isCursor = i === cursor;
      
      const prefix = isCursor ? ">" : " ";
      const mark = isSelected ? "[x]" : "[ ]";
      const time = entry.timestamp ? new Date(entry.timestamp * 1000).toLocaleString() : "";
      
      // Highlight row if cursor
      // Simple output for now
      console.log(`${prefix} ${mark} ${time} ${entry.command.slice(0, 60)}`);
    }
    
    console.log(`\nSelected: ${selectedIndices.size} / Total: ${entries.length}`);
  };

  render();

  for await (const key of readKeys()) {
    if (key.name === "q" || (key.ctrl && key.name === "c")) {
      console.log("Aborted.");
      break;
    }
    
    if (key.name === "up") {
      cursor--;
      if (cursor < 0) cursor = 0;
      render();
    }
    
    if (key.name === "down") {
      cursor++;
      if (cursor >= entries.length) cursor = entries.length - 1;
      render();
    }
    
    if (key.name === "space") {
        if (selectedIndices.has(cursor)) {
            selectedIndices.delete(cursor);
        } else {
            selectedIndices.add(cursor);
        }
        render();
    }
    
    if (key.name === "return") {
        if (selectedIndices.size === 0) {
            console.log("\nNo commands selected.");
            break;
        }

        const confirm = prompt(`\nDelete ${selectedIndices.size} commands? (y/N)`);
        if (confirm?.toLowerCase() === "y") {
            // Delete logic
            // We need to match indices back to original entries if filtered
            // But here entries is the list we are operating on.
            // If query was active, 'entries' is a subset. We need to remove them from 'allEntries'.
            
            // Collect raw strings/timestamps to identify entries to remove
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
        break;
    }
  }
}
