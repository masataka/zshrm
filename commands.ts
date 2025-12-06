import { readHistory, deduplicateEntries, writeHistory } from "./history.ts";

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

export async function runClear(historyPath: string, force = false, verbose = true) {
  if (verbose) console.log(`Reading history from ${historyPath}...`);
  const entries = await readHistory(historyPath);
  
  if (entries.length === 0) {
      if (verbose) console.log("History is already empty.");
      return 0;
  }

  if (!force) {
      const msg = `Are you sure you want to delete ALL ${entries.length} history entries? (y/N) `;
      const answer = prompt(msg);
      if (answer?.toLowerCase() !== "y") {
          console.log("Cancelled.");
          return 0;
      }
  }

  if (verbose) console.log("Clearing all history.");

  await writeHistory(historyPath, []);
  if (verbose) console.log("History updated.");
  return entries.length;
}

export async function runDelete(historyPath: string, query: string, force = false, verbose = true) {
  if (verbose) console.log(`Reading history from ${historyPath}...`);
  const entries = await readHistory(historyPath);

  // 部分一致でフィルタリング
  const newEntries = entries.filter(e => !e.command.includes(query));
  const removedCount = entries.length - newEntries.length;
  
  if (removedCount === 0) {
      if (verbose) console.log(`No entries found matching "${query}".`);
      return 0;
  }

  if (!force) {
      const msg = `Are you sure you want to delete ${removedCount} entries matching "${query}"? (y/N) `;
      const answer = prompt(msg);
      if (answer?.toLowerCase() !== "y") {
          console.log("Cancelled.");
          return 0;
      }
  }

  if (verbose) console.log(`Removed ${removedCount} entries matching "${query}".`);

  await writeHistory(historyPath, newEntries);
  if (verbose) console.log("History updated.");
  return removedCount;
}


