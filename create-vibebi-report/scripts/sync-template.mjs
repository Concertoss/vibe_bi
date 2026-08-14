#!/usr/bin/env node
/**
 * Sync ../template-report -> ./template (exclude node_modules etc.)
 * Run before publish so the npm package is self-contained.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const packageRoot = path.resolve(__dirname, "..");
const src = path.resolve(packageRoot, "..", "template-report");
const dest = path.join(packageRoot, "template");

const SKIP = new Set([
  "node_modules",
  ".git",
  "dist",
  "__pycache__",
  ".venv",
  "venv",
  "package-lock.json",
]);

function copyDir(from, to) {
  fs.mkdirSync(to, { recursive: true });
  for (const entry of fs.readdirSync(from, { withFileTypes: true })) {
    if (SKIP.has(entry.name)) continue;
    const a = path.join(from, entry.name);
    const b = path.join(to, entry.name);
    if (entry.isDirectory()) copyDir(a, b);
    else if (entry.isFile()) fs.copyFileSync(a, b);
  }
}

if (!fs.existsSync(path.join(src, "frontend", "package.json"))) {
  console.error("找不到 ../template-report，无法同步");
  process.exit(1);
}

fs.rmSync(dest, { recursive: true, force: true });
copyDir(src, dest);
console.log(`Synced template-report -> ${dest}`);
