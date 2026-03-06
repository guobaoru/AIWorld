# HelloWorld 前端项目

这是一个用于承接 helloworld 服务接口的前端项目。

## 项目结构

```
frontend/
├── public/
│   ├── index.html      # 主页面
│   ├── app.js          # JavaScript 逻辑
│   └── style.css       # 样式文件
├── build/              # 构建输出目录
└── package.json        # 项目配置
```

## 功能特性

1. Ping 测试：测试后端服务是否正常运行
2. HelloWorld 问候：调用后端接口获取个性化问候

## 部署方式

### 方式一：通过后端 Go 服务直接访问（推荐）

1. 启动后端 Go 服务：
```bash
cd /Users/guobaoru/go/src/code.byted.org/guobaoru/helloworld
go run main.go handler.go
```

2. 在浏览器中访问：`http://localhost:8080`（默认端口）

### 方式二：独立运行前端

1. 安装 serve（如果尚未安装）：
```bash
npm install -g serve
```

2. 运行前端：
```bash
cd /Users/guobaoru/go/src/code.byted.org/guobaoru/helloworld/frontend
npm run dev
```

3. 在浏览器中访问：`http://localhost:3000`

注意：使用方式二时，需要确保后端服务也在运行，并且修改 app.js 中的 API_BASE_URL 为正确的后端地址。

## 构建项目

```bash
cd frontend
npm run build
```

构建产物将输出到 `build/` 目录。
