import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const SKIP_DIR_NAMES = new Set([
  "node_modules",
  ".git",
  "dist",
  "__pycache__",
  ".venv",
  "venv",
  ".pytest_cache",
]);

const TEXT_EXT = new Set([
  ".ts",
  ".tsx",
  ".js",
  ".jsx",
  ".mjs",
  ".cjs",
  ".json",
  ".md",
  ".py",
  ".txt",
  ".yml",
  ".yaml",
  ".html",
  ".css",
  ".env",
  ".cursorrules",
  ".gitignore",
  ".dockerignore",
  "Dockerfile",
]);

function shouldSkip(name) {
  return SKIP_DIR_NAMES.has(name);
}

function isProbablyText(filePath) {
  const base = path.basename(filePath);
  if (base === "Dockerfile" || base === ".cursorrules" || base.startsWith(".")) {
    return true;
  }
  return TEXT_EXT.has(path.extname(filePath));
}

function resolveTemplateRoot(packageRoot) {
  const bundled = path.join(packageRoot, "template");
  if (fs.existsSync(path.join(bundled, "frontend", "package.json"))) {
    return bundled;
  }
  // Monorepo fallback: ../template-report
  const sibling = path.resolve(packageRoot, "..", "template-report");
  if (fs.existsSync(path.join(sibling, "frontend", "package.json"))) {
    return sibling;
  }
  throw new Error(
    "找不到报表模板。请在 create-vibebi-report 目录执行 npm run sync-template，或确保仓库含 template-report。",
  );
}

function copyDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    if (shouldSkip(entry.name)) continue;
    const from = path.join(src, entry.name);
    const to = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDir(from, to);
    } else if (entry.isFile()) {
      fs.copyFileSync(from, to);
    }
  }
}

function walkFiles(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (shouldSkip(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walkFiles(full, out);
    else if (entry.isFile()) out.push(full);
  }
  return out;
}

function applyReplacements(content, map) {
  let next = content;
  for (const [from, to] of Object.entries(map)) {
    next = next.split(from).join(to);
  }
  return next;
}

function rewriteTextFiles(targetDir, map) {
  for (const file of walkFiles(targetDir)) {
    if (!isProbablyText(file)) continue;
    const raw = fs.readFileSync(file, "utf8");
    const next = applyReplacements(raw, map);
    if (next !== raw) {
      fs.writeFileSync(file, next, "utf8");
    }
  }
}

function writeHostRegisterHint(targetDir, { title, reportCode, frontendPort, backendPort }) {
  const tip = `# 接入 VibeBI Host 提示

本报表已生成，可独立开发。接入底座时：

1. 在 Host「菜单管理」新增菜单：
   - 名称：${title}
   - report_code：\`${reportCode}\`
   - path：\`/reports/${reportCode}\`
   - component_url：\`http://localhost:${frontendPort}\`
   - backend_url：\`http://localhost:${backendPort}\`
   - visible_roles：\`admin,viewer\`

2. 点击「同步元数据」（子报表需先启动），再到「数据权限」配置规则。

3. 前端嵌入后应通过网关访问数据：
   \`/api/proxy/${reportCode}/api/report/data\`

本地启动：

\`\`\`bash
# 后端
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload --port ${backendPort}

# 前端
cd frontend
npm install
npm run dev
\`\`\`
`;
  fs.writeFileSync(path.join(targetDir, "HOST_INTEGRATION.md"), tip, "utf8");
}

function runNpmInstall(frontendDir) {
  console.log("\n⏳ npm install (frontend)...");
  const result = spawnSync("npm", ["install"], {
    cwd: frontendDir,
    stdio: "inherit",
    env: process.env,
    shell: true,
    windowsHide: true,
  });
  if (result.status !== 0) {
    console.warn("⚠️  npm install 失败，请稍后手动在 frontend/ 执行 npm install");
  }
}

/**
 * Copy template into targetDir and apply project-specific replacements.
 */
export async function scaffold({
  packageRoot,
  targetDir,
  title,
  reportCode,
  frontendPort,
  backendPort,
  installDeps,
}) {
  if (fs.existsSync(targetDir) && fs.readdirSync(targetDir).length > 0) {
    throw new Error(`目标目录非空：${targetDir}`);
  }

  const templateRoot = resolveTemplateRoot(packageRoot);
  console.log(`模板来源: ${templateRoot}`);
  console.log(`生成目录: ${targetDir}`);

  fs.mkdirSync(targetDir, { recursive: true });
  copyDir(templateRoot, targetDir);

  const packageName = `vibebi-${reportCode}-frontend`;
  const serviceBackend = `${reportCode}-backend`;
  const serviceFrontend = `${reportCode}-frontend`;

  rewriteTextFiles(targetDir, {
    "template-report": reportCode,
    "模板报表": title,
    "vibebi-template-report-frontend": packageName,
    "template-report-backend": serviceBackend,
    "template-report-frontend": serviceFrontend,
    "5174": String(frontendPort),
    "8001": String(backendPort),
  });

  // Ensure meta.py REPORT_CODE / title are correct even if copy came from sibling
  const metaPath = path.join(targetDir, "backend", "app", "meta.py");
  if (fs.existsSync(metaPath)) {
    const meta = `"""Report metadata contract for Host sync."""

REPORT_CODE = "${reportCode}"

REPORT_META = {
    "report_code": REPORT_CODE,
    "title": "${title.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}",
    "filterable_fields": [
        {
            "field_key": "dept",
            "label": "区域",
            "value_type": "enum",
            "operators": ["in", "eq"],
            "value_source": "static",
            "values": ["华东区", "华北区", "华南区", "西南区"],
            "required": False,
        }
    ],
}
`;
    fs.writeFileSync(metaPath, meta, "utf8");
  }

  writeHostRegisterHint(targetDir, { title, reportCode, frontendPort, backendPort });

  if (installDeps) {
    runNpmInstall(path.join(targetDir, "frontend"));
  }

  console.log(`
✅ 报表脚手架已生成：${targetDir}

下一步：
  cd ${path.relative(process.cwd(), targetDir) || "."}

  # 后端
  cd backend
  pip install -r requirements.txt
  uvicorn app.main:app --reload --port ${backendPort}

  # 前端（新开终端）
  cd frontend
  ${installDeps ? "" : "npm install && "}npm run dev

详见 HOST_INTEGRATION.md 了解如何挂到 VibeBI 底座。
`);
}
