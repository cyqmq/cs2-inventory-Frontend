# 架构总览

> 前端仓库：https://github.com/cyqmq/cs2-inventory-Frontend
> 后端仓库：https://github.com/cyqmq/cs2-inventory-serverapi

```
┌─── 前端（Electron / Web SPA）──────────────────────────────────┐
│                                                                  │
│  app/                                                            │
│  ├── routes/         页面路由（首页、合成、设置、登录等）        │
│  ├── components/     UI 组件（库存网格、物品编辑、开箱转盘等）   │
│  ├── hooks/          React Hooks（数据获取、状态管理）           │
│  ├── utils/          工具函数（fetch 封装、翻译、本地存储等）    │
│  ├── api-client.ts   API 调用封装（apiGet / apiPost）            │
│  ├── data/           数据定义（API URL、同步类型、外观等）       │
│  ├── translations/   多语言翻译（27 种语言）                     │
│  └── entry.client.tsx 客户端入口                                 │
│                                                                  │
│  electron/                                                       │
│  ├── main.ts         Electron 主进程（窗口管理、Steam 登录）     │
│  └── preload.ts      预加载脚本（IPC 桥接）                      │
│                                                                  │
│  ┌─ 两种运行模式 ──────────────────────────────────────┐        │
│  │                                                     │        │
│  │  Web SPA:  Vite 开发服务器 → 浏览器                 │        │
│  │  Electron: Vite + Electron 窗口 → 桌面应用          │        │
│  └─────────────────────────────────────────────────────┘        │
│                              ↕ HTTP JSON                        │
│               apiGet("/api/init") → http://localhost:3000        │
└─────────────────────────────────────────────────────────────────┘
                              ↕
┌─── 后端 API 服务器 ────────────────────────────────────────────┐
│                                                                  │
│  Express + React Router v8                                      │
│  Prisma + PostgreSQL                                            │
│  Steam OAuth / API Key 认证                                     │
│                                                                  │
│  端口：3000                                                      │
└─────────────────────────────────────────────────────────────────┘
```

## 关键设计

### 前后端分离

- 前端是纯静态 SPA，不依赖后端渲染任何 HTML
- 所有数据通过 HTTP JSON API 获取
- 前端可独立开发运行，只需后端 API 地址可访问

### 两种运行模式

| 模式 | 入口 | 端口 | 说明 |
|---|---|---|---|
| Web SPA | `npm run dev` | 5173 | 浏览器访问，适合开发调试 |
| Electron | `npm run dev:electron` | 5173 + Electron | 桌面窗口，支持 Steam 登录 |

### Electron Steam 登录流程

1. 用户点击 Sign In → 主窗口跳转 `https://steamcommunity.com/openid/login`
2. Steam 回调到 `http://127.0.0.1:{port}/steam-callback`
3. 桌面端验证 OpenID（直连 Steam，绕过 GFW）
4. 桌面端调用 `GET /api/auth/electron` 创建 session
5. 设置 Cookie → 刷新页面加载用户数据

### API 通信

前端通过 `api-client.ts` 封装的 `apiGet()`/`apiPost()` 函数调用后端 API：

- 开发环境默认连接 `http://localhost:3000`
- 浏览器模式自动使用 `window.location.origin`
- Electron 模式通过 IPC 从主进程获取 API 地址
- 所有请求携带 Cookie（session 认证）

## 目录结构

```
app/
├── routes/              页面路由
│   ├── _index.tsx       首页（库存展示）
│   ├── craft._index.tsx 合成
│   ├── settings._index.tsx  设置
│   ├── sign-in          Steam 登录
│   └── sign-out         退出登录
├── components/          UI 组件
│   ├── inventory/       库存网格、物品卡片
│   ├── unlock-case/     开箱转盘
│   ├── craft/           合成编辑器
│   ├── viewer/          3D 检视器
│   └── hooks/           React Hooks
├── data/                数据定义
│   ├── api-urls.ts      API 端点常量
│   ├── sync.ts          同步相关
│   ├── backgrounds.ts   背景列表
│   └── languages.ts     语言列表
├── utils/               工具函数
│   ├── fetch.ts         HTTP 请求封装
│   ├── translation.ts   翻译工具
│   └── inventory.ts     库存数据处理
└── translations/        多语言文件（27 种语言支持）
```

## 技术栈

| 层 | 技术 |
|---|---|
| UI 框架 | React 19 |
| 路由 | React Router v8（SPA 模式） |
| 桌面壳 | Electron |
| 样式 | Tailwind CSS v4 |
| 图标 | Font Awesome 7 |
| 构建 | Vite + esbuild |
| 测试 | Vitest + happy-dom |
| 类型 | TypeScript |
