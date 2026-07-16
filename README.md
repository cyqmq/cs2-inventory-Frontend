# CS2 Inventory Simulator — 前端

桌面端（Electron）和 Web SPA 客户端，用于 [CS2 Inventory Server API](https://github.com/cyqmq/cs2-inventory-serverapi)。查看和管理 CS2 库存、开箱、合成物品等。

## 环境要求

- **Node.js** >= 24

## 安装

```bash
git clone https://github.com/cyqmq/cs2-inventory-Frontend.git
cd cs2-inventory-Frontend
npm install
```

## 开发

启动 Web SPA 开发服务器：

```bash
npm run dev
```

浏览器打开 `http://localhost:5173`（应用默认连接后端 `http://localhost:3000`）。

### Electron

启动 Electron 窗口：

```bash
npm run dev:electron
```

打包 Electron 应用：

```bash
npm run build
npm run build:electron
```

## 生产构建

```bash
npm run build
```

构建产物输出到 `build/client/`（SPA index.html + 静态资源）。

## 脚本

| 命令 | 说明 |
|---|---|
| `npm run dev` | 启动 Vite 开发服务器（SPA 模式） |
| `npm run dev:electron` | 启动开发服务器 + Electron 窗口 |
| `npm run build` | 构建 SPA 生产版本 |
| `npm run build:electron` | 打包 Electron 应用 |
| `npm run start:electron` | 运行已构建的 Electron 应用 |
| `npm run test` | 运行 Vitest 测试 |
| `npm run lint` | ESLint 代码检查 |
| `npm run typecheck` | TypeScript 类型检查 |

## 技术栈

- **UI**：React 19 + React Router v8（SPA 模式）
- **桌面端**：Electron
- **样式**：Tailwind CSS v4
- **图标**：Font Awesome 7
- **语言**：TypeScript
- **构建**：Vite + esbuild
