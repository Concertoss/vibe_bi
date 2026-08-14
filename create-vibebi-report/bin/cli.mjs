#!/usr/bin/env node
import path from "node:path";
import { fileURLToPath } from "node:url";
import { scaffold } from "../lib/scaffold.mjs";
import { askQuestions } from "../lib/prompt.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const packageRoot = path.resolve(__dirname, "..");

function printHelp() {
  console.log(`
create-vibebi-report — 在当前目录生成 VibeBI 报表脚手架

用法:
  npx create-vibebi-report [项目目录名]
  npm create vibebi-report@latest [项目目录名]
  create-vibebi-report [项目目录名]

示例:
  mkdir my-workspace && cd my-workspace
  npx create-vibebi-report sales-board

选项:
  -h, --help     显示帮助
  -y, --yes      使用默认值，少提问
`);
}

async function main() {
  const args = process.argv.slice(2);
  if (args.includes("-h") || args.includes("--help")) {
    printHelp();
    return;
  }

  const yes = args.includes("-y") || args.includes("--yes");
  const positional = args.filter((a) => !a.startsWith("-"));
  const defaultDir = positional[0] || "my-report";

  console.log("\n📦 VibeBI Report Scaffold\n");

  const answers = await askQuestions(
    {
      dirName: defaultDir,
      title: "新报表",
      reportCode: defaultDir.replace(/[^a-zA-Z0-9_-]/g, "-").toLowerCase() || "my-report",
      frontendPort: "5175",
      backendPort: "8002",
      installDeps: true,
    },
    { yes },
  );

  const targetDir = path.resolve(process.cwd(), answers.dirName);
  await scaffold({
    packageRoot,
    targetDir,
    title: answers.title,
    reportCode: answers.reportCode,
    frontendPort: Number(answers.frontendPort),
    backendPort: Number(answers.backendPort),
    installDeps: answers.installDeps,
  });
}

main().catch((err) => {
  console.error("\n❌", err instanceof Error ? err.message : err);
  process.exit(1);
});
