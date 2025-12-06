

export type Key = {
  name?: string;
  ctrl?: boolean;
  meta?: boolean;
  shift?: boolean;
  sequence?: string;
};

// Re-export readKeypress or implement a simple wrapper if needed.
// For now, we will use a naive implementation to avoid external dependencies if possible,
// but handling escape sequences correctly is hard.
// Let's try to implement a simple reader using Deno.stdin.readable.

export async function* readKeys(): AsyncGenerator<Key> {
  const buffer = new Uint8Array(8);
  
  // Set raw mode
  try {
    Deno.stdin.setRaw(true);
  } catch {
    console.error("Could not set raw mode. TUI not supported.");
    return;
  }

  try {
    while (true) {
      const n = await Deno.stdin.read(buffer);
      if (n === null || n === 0) break;
      
      const sequence = new TextDecoder().decode(buffer.subarray(0, n));
      
      // Simple parsing logic for common keys
      if (sequence === "\x03") { // Ctrl+C
        yield { name: "c", ctrl: true, sequence };
        break;
      }
      if (sequence === "\x1b" || sequence === "\u001b") { // Escape
        yield { name: "escape", sequence };
        continue;
      }
      if (sequence === "\r" || sequence === "\n") {
        yield { name: "return", sequence };
        continue;
      }
      if (sequence === " ") {
          yield { name: "space", sequence };
          continue;
      }

      // Arrow keys (typical ANSI sequences)
      if (sequence === "\x1b[A") { yield { name: "up", sequence }; continue; }
      if (sequence === "\x1b[B") { yield { name: "down", sequence }; continue; }
      if (sequence === "\x1b[C") { yield { name: "right", sequence }; continue; }
      if (sequence === "\x1b[D") { yield { name: "left", sequence }; continue; }
      
      // Other keys
      if (sequence.length === 1) {
          yield { name: sequence, sequence };
      }
    }
  } finally {
    try {
      Deno.stdin.setRaw(false);
    } catch {
      // ignore
    }
  }
}
