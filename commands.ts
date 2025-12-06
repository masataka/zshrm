import { readHistory, deduplicateEntries, writeHistory, type HistoryEntry } from "./history.ts";

export async function runDedup(historyPath: string, verbose = true) {
  if (verbose) console.log(`Reading history from ${historyPath}...`);
  
  const entries = await readHistory(historyPath);
  if (verbose) console.log(`Loaded ${entries.length} entries.`);

  const deduped = deduplicateEntries(entries);
  if (verbose) console.log(`Deduplicated to ${deduped.length} entries.`);

  if (deduped.length < entries.length) {
    await writeHistory(historyPath, deduped);
    if (verbose) {
      console.log(`Removed ${entries.length - deduped.length} duplicates.`);
      console.log("History updated.");
    }
    return entries.length - deduped.length;
  } else {
    if (verbose) console.log("No duplicates found.");
    return 0;
  }
}

export async function runClear(historyPath: string, query?: string, verbose = true) {
  if (verbose) console.log(`Reading history from ${historyPath}...`);
  const entries = await readHistory(historyPath);
  
  let newEntries: HistoryEntry[] = [];
  let removedCount = 0;

  if (query) {
      // 部分一致でフィルタリング
      newEntries = entries.filter(e => !e.command.includes(query));
      removedCount = entries.length - newEntries.length;
      if (verbose) console.log(`Removed ${removedCount} entries matching "${query}".`);
  } else {
      // 全削除
      if (verbose) console.log("Clearing all history.");
      removedCount = entries.length;
  }

  await writeHistory(historyPath, newEntries);
  if (verbose) console.log("History updated.");
  return removedCount;
}
