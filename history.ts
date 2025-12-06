import { exists } from "@std/fs";

export interface HistoryEntry {
  raw: string;
  command: string;
  timestamp?: number;
}

export async function readHistory(filePath: string): Promise<HistoryEntry[]> {
  if (!(await exists(filePath))) {
    return [];
  }
  const content = await Deno.readTextFile(filePath);
  return parseHistory(content);
}

export async function writeHistory(filePath: string, entries: HistoryEntry[]): Promise<void> {
  const content = entries.map((e) => e.raw).join("\n") + "\n";
  await Deno.writeTextFile(filePath, content);
}

export function parseHistory(content: string): HistoryEntry[] {
  const lines = content.split("\n");
  const entries: HistoryEntry[] = [];
  
  // NOTE: This simple parser assumes one line per command for now.
  // Real zsh history might handle multiline commands with backslashes.
  for (const line of lines) {
    if (!line.trim()) continue;

    // Check for extended history format: : <timestamp>:<duration>;<command>
    const match = line.match(/^: (\d+):(\d+);(.*)$/);
    if (match) {
      entries.push({
        raw: line,
        timestamp: parseInt(match[1]),
        command: match[3],
      });
    } else {
      entries.push({
        raw: line,
        command: line,
      });
    }
  }
  return entries;
}

export function deduplicateEntries(entries: HistoryEntry[]): HistoryEntry[] {
  const map = new Map<string, HistoryEntry>();
  for (const entry of entries) {
    if (map.has(entry.command)) {
      map.delete(entry.command);
    }
    map.set(entry.command, entry);
  }
  return Array.from(map.values());
}

