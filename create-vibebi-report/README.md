# create-vibebi

一键生成 VibeBI 报表脚手架（FastAPI + Vite/React/ECharts + Data-Filters）。

命令：**`vibebi`**

## 用法（无需 clone）

```bash
npx create-vibebi sales-board

# 或
npm create vibebi sales-board

# 全局安装
npm install -g create-vibebi
vibebi sales-board
```

> 国内若用淘宝源：一般会自动从 npmjs 同步，**不用单独上传到淘宝**。  
> 刚发布后镜像可能有几分钟～几小时延迟；着急时临时切官方源安装即可。

## 本机开发

```bash
cd create-vibebi-report
npm run sync-template
npm link
vibebi demo-report
```

源码：https://github.com/Concertoss/vibe_bi
