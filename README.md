# 🤖 AI World

![Go](https://img.shields.io/badge/Go-1.24-00ADD8?logo=go)
![JavaScript](https://img.shields.io/badge/JavaScript-ES6-F7DF1E?logo=javascript)
![Gin](https://img.shields.io/badge/Framework-Gin-00ADD8)
![GORM](https://img.shields.io/badge/ORM-GORM-CQ3930)
![SQLite](https://img.shields.io/badge/Database-SQLite-003B57?logo=sqlite)
![Docker](https://img.shields.io/badge/Docker-Supported-2496ED?logo=docker)
![Status](https://img.shields.io/badge/Status-Active-brightgreen)
![License](https://img.shields.io/badge/License-MIT-blue.svg)

> **"Code written by AI, for humans."**
> 
> 一个由 AI 驱动的全栈开发实验场。本项目展示了 AI 在现代软件工程中的能力——从简单的 HelloWorld 到复杂的全栈应用。

## 🌟 项目简介

AI World 不仅仅是一个代码仓库，它是 AI 辅助编程（AI-Assisted Programming）的一个缩影。这里的每一行代码、每一个功能模块，都是通过人机协作（Human-AI Collaboration）完成的。

我们的目标是：探索 AI 在全栈开发中的边界，打造一个持续进化的、有趣的、实用的开源项目。

## ✨ 功能特性 (Features)

目前，AI World 包含以下功能模块：

- **🎮 游戏分类 (Games)**: (v0.7.0 重新设计, v0.9.0 优化)
  - **🏠 首页分类**: 游戏、工具、社交三大分类，扁平风格 Tab 切换。
  - **粒子特效**: (v0.9.0 新增) 点击 logo 触发 30 秒粒子旋转特效，支持点击停止。
  - **🏃 超级马里奥 (Super Mario)**: (v0.7.0 新增)
    - **经典第一关**: 完整复刻 Super Mario Bros 1-1 关卡设计。
    - **精致画面**: 侧面视角角色，45度侧视城墙终点。
    - **丰富玩法**: 二段跳、滑翔伞、碰撞砖块、收集金币。
    - **关底设计**: 三角形台阶、旗杆、45度侧视城墙大门。
  - **✈️ 雷霆战机 (Shooter)**: (v0.6.0 新增, v0.9.0 优化)
    - **弹幕射击**: 经典飞行射击游戏体验。
    - **升级系统**: 收集道具升级武器，4种攻击模式（3排弹道、扇形散射、激光、追踪）。
    - **BOSS战**: 体积3倍的紫色BOSS战机，左右横移攻击。
    - **激光优化**: 激光弹道跟随玩家战机移动，天蓝色圆柱筒状效果。
    - **追踪弹道**: 追踪速率提升一倍，更精准锁定目标。
  - **🏰 塔防游戏 (Tower Defense)**: (v0.8.0 新增)
    - **4种防御塔**: 箭塔🏹、炮塔💣、冰塔❄️、火塔🔥，各有特色。
    - **4种敌人**: 小兵👾、疾风💨、重装🛡️、BOSS👹，难度递增。
    - **完整关卡**: 10波敌人，S型复杂路线，策略性放置。
    - **特效系统**: 放置预览、范围显示、粒子特效、状态光环。
  - **🧱 俄罗斯方块 (Tetris)**: (v0.6.0 新增)
    - **经典玩法**: 7种经典方块，旋转、移动、消除。
    - **高分记录**: 本地存储最高分，挑战自我。
  - **🐍 贪吃蛇 (Snake Game)**
    - **经典重现**: HTML5 Canvas 实现流畅的游戏体验。
    - **全球排行榜**: 实时更新的在线高分榜，数据持久化到数据库。
    - **🤖 AI 自动演示**: (v0.4.0 新增) 内置智能 AI 玩家，使用 BFS 空间搜索和贪心算法自动演示游戏玩法。
  - **♟️ 简易自走棋 (Auto Chess)**: (v0.8.0 新增)
    - **5×5 棋盘**: 经典自走棋布局，策略对战。
    - **3类棋子**: 战士🛡️、法师🔮、射手🏹，各3个等级。
    - **自动合成**: 3个同星同类型自动合成更高星，属性翻倍。
    - **自动对战**: 模拟战斗系统，胜利5轮即获胜。

- **🔧 工具分类 (Tools)**: (v0.7.0 新增)
  - **💰 记账应用 (Accounting App)**
    - **全栈实现**: 前端 Vue/Vanilla JS + 后端 Go API。
    - **数据库支持**: (v0.3.0 新增) 迁移至 SQLite + GORM，数据更安全、更高效。
    - **统计分析**: 实时计算总收入、总支出和结余。
    - **📊 数据可视化**: 动态生成收支结构饼图，一目了然。
    - **🤖 AI 财务顾问**: 智能分析财务状况，提供省钱建议。
  - **📝 AI 笔记 (Notes)**: (v0.5.0 新增)
    - **智能笔记**: 支持 Markdown 编辑，实时预览。
    - **AI 辅助**: 内置 AI 写作助手。

- **👥 社交分类 (Social)**: (v0.7.0 新增)
  - **💬 AI Hub (聊天室)**: (v0.3.0 新增)
    - **实时互动**: 基于 WebSocket 的多人在线聊天室。
    - **智能助手**: 内置规则引擎 AI 机器人，可回答基础问题（尝试发送 `@ai hello`）。

- **🚀 基础服务**
  - **Ping / HelloWorld**: 简单的 API 接口，用于测试服务连通性。
  - **静态资源托管**: 高效的前端资源服务。

- **🐳 工程化 (Engineering)**
  - **Docker 支持**: 提供标准 Dockerfile 和 Docker Compose 配置。
  - **模块化架构**: 清晰的后端服务分层设计。

## 🎨 界面优化 (UI Optimization)
  - **主界面**: 优化 logo 设计，移除淡绿色背景，更新 tagline 为"专属你的AI World"。
  - **游戏顺序**: 调整为 1.超级马里奥 2.雷霆战机 3.塔防游戏 4.俄罗斯方块 5.贪吃蛇 6.简易自走棋。
  - **粒子特效**: 点击 logo 触发 30 秒粒子旋转特效，支持点击停止。

## 🛠 技术栈 (Tech Stack)

- **Backend**: Go (Golang) 1.24, Gin Web Framework, Gorilla WebSocket
- **Database**: SQLite, GORM
- **Frontend**: HTML5, CSS3, Vanilla JavaScript (ES6+), Chart.js
- **Infrastructure**: Docker, Docker Compose
- **AI Engine**: Gemini-3-Pro-Preview

## 🚀 快速开始 (Quick Start)

### 方式一：Docker 部署 (推荐)

如果您已安装 Docker，只需一行命令即可启动：

```bash
docker-compose up -d
```

### 方式二：本地运行

1. **环境准备**
   确保你已安装 Go 1.24+。

2. **启动服务**
   ```bash
   cd backend/cmd/aiworld
   go run main.go
   ```

3. **体验**
   打开浏览器访问 [http://localhost:8080](http://localhost:8080)。

## 📂 目录结构

```
aiworld/
├── backend/                # 后端代码
│   ├── cmd/                # 应用程序入口
│   │   └── aiworld/
│   ├── pkg/                # 公共包
│   │   ├── database/       # 数据库连接
│   │   └── utils/          # 工具函数
│   └── services/           # 业务逻辑层
│       ├── accounting/     # 记账服务
│       ├── chat/           # 聊天室服务
│       ├── notes/          # 笔记服务
│       ├── snake/          # 贪吃蛇服务
│       ├── tetris/         # 俄罗斯方块服务
│       └── shooter/        # 雷霆战机服务
├── frontend/               # 前端代码
│   └── public/             # 静态资源 (HTML/JS/CSS)
│       ├── index.html      # 首页（分类 Tab）
│       ├── tower-defense.html  # 塔防游戏
│       ├── auto-chess.html # 简易自走棋
│       ├── mario.html      # 超级马里奥
│       ├── snake.html      # 贪吃蛇
│       ├── tetris.html     # 俄罗斯方块
│       ├── shooter.html    # 雷霆战机
│       ├── accounting.html # 记账应用
│       ├── notes.html      # AI 笔记
│       └── chat.html       # AI 聊天室
├── aiworld.db              # SQLite 数据库文件
├── Dockerfile              # Docker 构建文件
└── docker-compose.yml      # Docker 编排文件
```

## 🤝 贡献指南

欢迎提交 Issue 和 Pull Request！作为一个 AI 项目，我们特别欢迎你使用 AI 工具（如 Copilot, Trae, Cursor 等）来生成代码并提交。

---
*Built with ❤️ by Trae AI*
