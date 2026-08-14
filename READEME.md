你是一位资深全栈架构师。我们正在构建一个轻量级、AI 原生的报表底座系统（代号：VibeBI）。
系统架构为：底座（微前端 Host + 鉴权网关）+ 独立子报表微服务（React + FastAPI）。

请帮我在当前根目录下创建标准工程骨架，目录结构规划如下：

vibe-bi/
├── host-backend/       # 底座后端：用户管理、角色权限、菜单配置、API 反向代理网关
├── host-frontend/      # 底座前端：登录页、后台 Shell、动态菜单、无界(Wujie)微前端容器
└── template-report/    # 专供 AI 开发新报表的单体脚手架模板
    ├── frontend/       # Vite + React + ECharts + Tailwind
    ├── backend/        # FastAPI 独立查询服务 (自动读取 Gateway 注入的权限 Header)
    └── .cursorrules    # 专用于约束 AI 在子项目中编写报表的规范文件

请先帮我生成各模块的基础目录结构、`docker-compose.yml` 雏形，以及 Python/Node 的依赖配置文件（`requirements.txt` 和 `package.json`）。