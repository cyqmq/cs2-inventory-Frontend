# CS2 Inventory Simulator — Frontend

Desktop client (Electron) & Web SPA for [CS2 Inventory Server API](https://github.com/cyqmq/cs2-inventory-serverapi). View and manage your CS2 inventory, unbox cases, craft items, and more.

## Prerequisites

- **Node.js** >= 24

## Setup

```bash
git clone https://github.com/cyqmq/cs2-inventory-Frontend.git
cd cs2-inventory-Frontend
npm install
```

## Development

Start the Web SPA dev server:

```bash
npm run dev
```

Open `http://localhost:5173` in your browser (the app expects the backend at `http://localhost:3000`).

### Electron

Start with Electron window:

```bash
npm run dev:electron
```

Build Electron app:

```bash
npm run build
npm run build:electron
```

## Build for Production

```bash
npm run build
```

Output goes to `build/client/` (SPA index.html + assets).

## Scripts

| Script | Description |
|---|---|
| `npm run dev` | Start Vite dev server (SPA) |
| `npm run dev:electron` | Start dev server + Electron window |
| `npm run build` | Build SPA for production |
| `npm run build:electron` | Package Electron app |
| `npm run start:electron` | Run pre-built Electron app |
| `npm run test` | Run tests with Vitest |
| `npm run lint` | Lint with ESLint |
| `npm run typecheck` | TypeScript type check |

## Tech Stack

- **UI**: React 19 + React Router v8 (SPA mode)
- **Desktop**: Electron
- **Styling**: Tailwind CSS v4
- **Icons**: Font Awesome 7
- **Language**: TypeScript
- **Bundler**: Vite + esbuild
