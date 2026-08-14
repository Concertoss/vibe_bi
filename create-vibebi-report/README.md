# @euphon/create-vibebi

一键生成 VibeBI 报表脚手架（FastAPI + Vite/React/ECharts + Data-Filters）。

命令很短：**`vibebi`**

## 用法（无需 clone 本仓库）

```bash
# 推荐
npx @euphon/create-vibebi sales-board

# 或
npm create @euphon/vibebi sales-board

# 全局安装后
npm install -g @euphon/create-vibebi
vibebi sales-board
```

交互项：目录名、报表名称、`report_code`、前后端端口、是否自动 `npm install`。

## 本机开发联调

```bash
cd create-vibebi-report
npm run sync-template
npm link
vibebi demo-report
```

## 仓库

源码：[Concertoss/vibe_bi](https://github.com/Concertoss/vibe_bi)
