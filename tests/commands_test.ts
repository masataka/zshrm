import { assertEquals } from "@std/assert";
import { runDedup, runClear, runDelete } from "../commands.ts";
import { writeHistory } from "../history.ts";

const TEST_HISTORY_PATH = "./test_history_commands";

async function setupHistory() {
    const entries = [
        { raw: "cmd1", command: "cmd1", timestamp: 100 },
        { raw: "cmd1", command: "cmd1", timestamp: 110 }, // Duplicate
        { raw: "cmd2", command: "cmd2", timestamp: 120 },
        { raw: "grep foo", command: "grep foo", timestamp: 130 },
    ];
    await writeHistory(TEST_HISTORY_PATH, entries);
}

async function cleanup() {
    try {
        await Deno.remove(TEST_HISTORY_PATH);
    } catch {
        // ignore
    }
}

Deno.test("runDedup removes duplicates", async () => {
    await setupHistory();
    const removed = await runDedup(TEST_HISTORY_PATH, false);
    assertEquals(removed, 1);
    await cleanup();
});

Deno.test("runClear removes all entries", async () => {
    await setupHistory();
    const removed = await runClear(TEST_HISTORY_PATH, true, false);
    assertEquals(removed, 4);
    await cleanup();
});

Deno.test("runDelete removes filtered entries with query", async () => {
    await setupHistory();
    const removed = await runDelete(TEST_HISTORY_PATH, "grep", true, false);
    assertEquals(removed, 1);
    await cleanup();
});

