# create-vibebi-report

在任意目录一键生成 VibeBI 报表脚手架（FastAPI + Vite/React/ECharts + Data-Filters 契约）。

类似：

```bash
npm create vite@latest
npx create-react-app my-app
```

## 怎么安装 / 怎么用？

### 方式 A（推荐）：推到 GitHub 后用 npx（不用先全局安装）

1. 把整个 `VibeBI` 仓库推到 GitHub（公开或私有均可）。
2. 在任意空目录执行：

```bash
# 替换成你的仓库地址
npx --yes github:YOUR_ORG/VibeBI/create-vibebi-report

# 或指定子目录名
npx --yes github:YOUR_ORG/VibeBI/create-vibebi-report#main sales-board
```

> 说明：`npx github:org/repo/subdir` 要求该子目录是独立 npm 包（本目录已是）。  
> 若 npx 对子目录支持不理想，可改用方式 B / C。

### 方式 B：发布到 npm 后（体验最好）

```bash
cd create-vibebi-report
npm run sync-template
npm login
npm publish --access public
```

之后任何人：

```bash
npm create vibebi-report@latest
# 或
npx create-vibebi-report@latest my-report
```

### 方式 C：本机开发联调（现在就能用）

```bash
cd e:/code/other/VibeBI/create-vibebi-report
npm run sync-template
npm link

# 任意目录
cd D:/tmp
create-vibebi-report demo-sales
```

取消链接：`npm unlink -g create-vibebi-report`

## 交互项

| 问题 | 含义 |
|------|------|
| 项目目录名 | 在当前路径下创建的文件夹 |
| 报表显示名称 | 标题 / Host 菜单名 |
| report_code | 网关 `/api/proxy/{report_code}` |
| 前端/后端端口 | 本地开发端口 |
| 是否 npm install | 自动安装前端依赖 |

生成后包含：

- `backend/` FastAPI（`/api/meta` + `X-Data-Filters`）
- `frontend/` Vite React 报表示例
- `.cursorrules` AI 约束
- `HOST_INTEGRATION.md` 挂底座步骤

## 推到 GitHub 一般怎么做？

**是的，推到 GitHub 更合适**——团队共享脚手架、版本可回溯、别人用 `npx`/`npm create` 即可。

常见做法：

1. **单体仓库（当前）**：`VibeBI` 里放 `create-vibebi-report/` + `template-report/`  
   - 优点：模板和 CLI 一起演进  
   - 发布前跑 `npm run sync-template`，把模板打进 CLI 包

2. **发布 npm 包**（对外体验最好）  
   - 包名：`create-vibebi-report`（npm 约定 `create-*` 可用 `npm create xxx`）  
   - `files` 字段只发布 `bin/lib/template`  
   - `prepublishOnly` 自动 sync 模板

3. **私有公司内网**  
   - GitHub/GitLab private + `npx` 配 token  
   - 或私有 npm registry（Verdaccio / GitHub Packages）

不建议：只发一个散落的 `.bat`/`.ps1` 让同事手动拷贝——难版本化、难交互、难跨平台。

## 本地验证

```bash
cd create-vibebi-report
npm run sync-template
node ./bin/cli.mjs -y demo-report
```
