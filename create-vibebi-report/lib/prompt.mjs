import readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";

async function ask(rl, label, defaultValue) {
  const hint = defaultValue === undefined || defaultValue === "" ? "" : ` (${defaultValue})`;
  const answer = (await rl.question(`${label}${hint}: `)).trim();
  return answer || defaultValue;
}

async function askYesNo(rl, label, defaultYes) {
  const def = defaultYes ? "Y/n" : "y/N";
  const answer = (await rl.question(`${label} (${def}): `)).trim().toLowerCase();
  if (!answer) return defaultYes;
  return answer === "y" || answer === "yes";
}

/**
 * Interactive prompts. With `{ yes: true }` skips questions and uses defaults.
 */
export async function askQuestions(defaults, { yes = false } = {}) {
  if (yes) {
    return { ...defaults };
  }

  const rl = readline.createInterface({ input, output });
  try {
    const dirName = await ask(rl, "项目目录名", defaults.dirName);
    const title = await ask(rl, "报表显示名称", defaults.title);
    const reportCode = await ask(
      rl,
      "report_code（字母/数字/-/_，用于网关代理）",
      defaults.reportCode || dirName,
    );
    const frontendPort = await ask(rl, "前端端口", String(defaults.frontendPort));
    const backendPort = await ask(rl, "后端端口", String(defaults.backendPort));
    const installDeps = await askYesNo(rl, "生成后自动 npm install 前端依赖？", defaults.installDeps);

    if (!/^[a-zA-Z0-9_-]+$/.test(reportCode)) {
      throw new Error("report_code 只能包含字母、数字、下划线、中划线");
    }

    return {
      dirName,
      title,
      reportCode,
      frontendPort,
      backendPort,
      installDeps,
    };
  } finally {
    rl.close();
  }
}
