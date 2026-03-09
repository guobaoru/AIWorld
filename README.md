# 🤖 AI World

![Go](https://img.shields.io/badge/Go-1.24-00ADD8?logo=go)
![JavaScript](https://img.shields.io/badge/JavaScript-ES6-F7DF1E?logo=javascript)
![Gin](https://img.shields.io/badge/Framework-Gin-00ADD8)
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

- **🚀 基础服务**
  - **Ping / HelloWorld**: 简单的 API 接口，用于测试服务连通性。
  - **静态资源托管**: 高效的前端资源服务。

- **💰 记账应用 (Accounting App)**
  - **全栈实现**: 前端 Vue/Vanilla JS + 后端 Go API。
  - **数据持久化**: 自动保存每一笔收支记录。
  - **统计分析**: 实时计算总收入、总支出和结余。
  - **📊 数据可视化**: (v0.2.0 新增) 动态生成收支结构饼图，一目了然。
  - **🤖 AI 财务顾问**: (v0.2.0 新增) 智能分析财务状况，提供省钱建议。

- **🐍 贪吃蛇 (Snake Game)**
  - **经典重现**: HTML5 Canvas 实现流畅的游戏体验。
  - **全球排行榜**: 实时更新的在线高分榜，展示全球玩家实力。

- **🐳 工程化 (Engineering)**
  - **Docker 支持**: (v0.2.0 新增) 提供标准 Dockerfile 和 Docker Compose 配置。
  - **模块化架构**: 清晰的后端服务分层设计。

## 🛠 技术栈 (Tech Stack)

- **Backend**: Go (Golang) 1.24, Gin Web Framework
- **Frontend**: HTML5, CSS3, Vanilla JavaScript (ES6+), Chart.js
- **Infrastructure**: Docker, Docker Compose
- **Storage**: JSON File System (轻量级数据存储)
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
│   │   └── utils/          # 工具函数
│   └── services/           # 业务逻辑层
│       ├── accounting/     # 记账服务
│       └── snake/          # 贪吃蛇服务
├── frontend/               # 前端代码
│   └── public/             # 静态资源 (HTML/JS/CSS)
├── accounting_data.json    # 记账数据
├── snake_scores.json       # 贪吃蛇排行榜数据
├── Dockerfile              # Docker 构建文件
└── docker-compose.yml      # Docker 编排文件
```

## 🤝 贡献指南

欢迎提交 Issue 和 Pull Request！作为一个 AI 项目，我们特别欢迎你使用 AI 工具（如 Copilot, Trae, Cursor 等）来生成代码并提交。

---
*Built with ❤️ by Trae AI*
