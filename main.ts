import { parseArgs } from "@std/cli/parse-args";
import { runDedup, runClear } from "./commands.ts";
import { runUI } from "./ui.ts";
import { writeHistory, type HistoryEntry } from "./history.ts";
import { exists } from "@std/fs";

const DUMMY_HISTORY_PATH = "./dummy_zsh_history";

async function main() {
  const args = parseArgs(Deno.args, {
    boolean: ["help"],
    alias: { h: "help" },
  });

  if (args.help) {
    showHelp();
    Deno.exit(0);
  }

  const command = args._[0];
  const query = args._[1]?.toString();

  switch (command) {
    case "dedup": {
      const historyPath = getHistoryPath();
      await runDedup(historyPath);
      break;
    }
    case "clear": {
      const historyPath = getHistoryPath();
      await runClear(historyPath, query);
      break;
    }
    case "ui": {
      const historyPath = getHistoryPath();
      console.log(`Running ui${query ? ` with query: ${query}` : ""}...`);
      await runUI(historyPath, query);
      break;
    }
    
    // 裏コマンド: テストデータ生成
    case "test-gen": {
      console.log(`Generating dummy history at ${DUMMY_HISTORY_PATH}...`);
      const commands = [
        "ls -la",
        "git status",
        "deno task dev",
        "git add .",
        "git commit -m 'fix'",
        "cd ..",
        "cat README.md",
        "vim main.ts",
      ];
      const entries: HistoryEntry[] = [];
      const now = Math.floor(Date.now() / 1000);
      
      // 直近24時間のランダムな履歴を50件生成
      for (let i = 0; i < 50; i++) {
        const cmd = commands[Math.floor(Math.random() * commands.length)];
        const ts = now - Math.floor(Math.random() * 86400);
        // : <ts>:0;<cmd>
        const raw = `: ${ts}:0;${cmd}`;
        entries.push({ raw, command: cmd, timestamp: ts });
      }
      // 時系列順にソート
      entries.sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
      
      await writeHistory(DUMMY_HISTORY_PATH, entries);
      console.log("Done.");
      break;
    }

    // 裏コマンド: テストデータ削除
    case "test-clean": {
      if (await exists(DUMMY_HISTORY_PATH)) {
        console.log(`Removing ${DUMMY_HISTORY_PATH}...`);
        await Deno.remove(DUMMY_HISTORY_PATH);
        console.log("Done.");
      } else {
        console.log("No dummy history file found.");
      }
      break;
    }

    default:
      console.error("Unknown command. Use --help for usage.");
      Deno.exit(1);
  }
}

function showHelp() {
  console.log(`
zshrm - zsh history remove manager

Usage:
  zshrm <command> [options]

Commands:
  dedup           Deduplicate history (keep latest)
  clear [query]   Clear history (optionally filter by query)
  ui [query]      Interactive mode (optionally filter by query)

Options:
  -h, --help      Show this help message
  `);
}


function getHistoryPath(): string {
  const envPath = Deno.env.get("HISTFILE");
  if (envPath) return envPath;
  
  const home = Deno.env.get("HOME");
  if (!home) {
    throw new Error("Could not determine HOME directory.");
  }
  return `${home}/.zsh_history`;
}

if (import.meta.main) {
  main();
}

