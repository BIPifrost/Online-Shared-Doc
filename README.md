# 在线共享文档协作系统

这是一个面向课程实验的在线共享文档项目，目标是实现多人同时编辑、实时同步、版本快照、差异对比、导出和断线重连等能力。

项目采用前后端分离结构：前端负责文档界面、协作体验和交互展示，后端负责文档接口、快照管理、实时通信和 Yjs 协同状态维护。

## 功能概览

当前项目已经具备以下主要功能：

- 匿名昵称进入系统
- 创建文档和加入已有文档
- 多人实时协同编辑
- 在线协作者列表展示
- 聊天消息与系统消息展示
- Markdown 实时预览
- 手动保存生成版本快照
- 快照详情查看
- 两个版本之间的 diff 对比
- 导出 Markdown、HTML、TXT
- 断线检测与自动重连

## 技术栈

前端：

- React
- Vite
- TypeScript
- CodeMirror 6
- Yjs
- Socket.IO Client
- react-markdown

后端：

- Node.js
- Express
- TypeScript
- Socket.IO
- Yjs / y-websocket
- SQLite

## 项目结构

```text
OnlineSharedDoc/
├─ client/        前端项目，负责页面、编辑器、预览和交互
├─ server/        后端项目，负责接口、快照、实时通信和协同状态
├─ shared/        前后端共享类型定义
├─ README.md
├─ package.json
└─ tsconfig.base.json
```

更细的职责可以简单理解为：

- `client/src/pages/`：页面入口
- `client/src/features/`：按功能拆分的前端模块
- `server/src/routes/`：HTTP 路由
- `server/src/modules/`：文档、历史版本、导出、聊天、协同等后端模块
- `server/src/sockets/`：Socket.IO 实时事件处理

## 本地运行

### 1. 安装依赖

在项目根目录执行：

```bash
npm install
```

### 2. 同时启动前后端

```bash
npm run dev
```

### 3. 单独启动前端

```bash
npm run dev:client
```

### 4. 单独启动后端

```bash
npm run dev:server
```

### 5. 构建项目

```bash
npm run build
```

## 默认端口

- 前端开发服务：`5173`
- 后端服务：`3001`

当前前端会通过代理访问后端接口和实时服务，因此开发时通常只需要打开前端地址即可。

## 使用说明

1. 启动项目后，打开浏览器访问前端地址
2. 输入昵称后创建文档，或通过文档 ID 加入已有文档
3. 在文档页中进行多人协同编辑
4. 点击 `Save` 手动生成快照版本
5. 在左侧版本列表中选择 1 个版本查看详情，选择 2 个版本查看 diff
6. 点击 `Export` 导出当前最新文档内容
