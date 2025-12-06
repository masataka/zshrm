import { assertEquals } from "@std/assert";
import { deduplicateEntries, HistoryEntry, parseHistory } from "../history.ts";

Deno.test("parseHistory parses simple commands", () => {
    const content = "ls -la\ncd ..\n";
    const entries = parseHistory(content);
    assertEquals(entries.length, 2);
    assertEquals(entries[0].command, "ls -la");
    assertEquals(entries[1].command, "cd ..");
});

Deno.test("parseHistory parses extended history", () => {
    const content = ": 1600000000:0;ls -la\n: 1600000010:0;git status\n";
    const entries = parseHistory(content);
    assertEquals(entries.length, 2);
    assertEquals(entries[0].timestamp, 1600000000);
    assertEquals(entries[0].command, "ls -la");
    assertEquals(entries[1].timestamp, 1600000010);
    assertEquals(entries[1].command, "git status");
});

Deno.test("deduplicateEntries removes duplicates keeping the latest", () => {
    const entries: HistoryEntry[] = [
        { raw: ": 100:0;cmd1", command: "cmd1", timestamp: 100 },
        { raw: ": 110:0;cmd2", command: "cmd2", timestamp: 110 },
        { raw: ": 120:0;cmd1", command: "cmd1", timestamp: 120 }, // Newest cmd1
    ];

    const deduped = deduplicateEntries(entries);
    
    assertEquals(deduped.length, 2);
    // cmd2 should be first (older), cmd1 second (newer)
    assertEquals(deduped[0].command, "cmd2");
    assertEquals(deduped[0].timestamp, 110);
    
    assertEquals(deduped[1].command, "cmd1");
    assertEquals(deduped[1].timestamp, 120);
});

Deno.test("deduplicateEntries handles simple format (keeps last occurrence)", () => {
    const entries: HistoryEntry[] = [
        { raw: "cmd1", command: "cmd1" },
        { raw: "cmd2", command: "cmd2" },
        { raw: "cmd1", command: "cmd1" },
    ];
    
    const deduped = deduplicateEntries(entries);
    assertEquals(deduped.length, 2);
    assertEquals(deduped[0].command, "cmd2");
    assertEquals(deduped[1].command, "cmd1");
});
