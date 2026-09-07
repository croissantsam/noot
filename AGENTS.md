# croissant-electron - Agent Instructions

## Project Overview

This is a boilerplate and project generator for Electron applications using:

- **Electron** - Cross-platform desktop apps
- **Vite** (via electron-vite) - Build tool and dev server
- **React 19** - UI framework
- **TypeScript** - Type safety
- **TanStack Router** - Type-safe routing with file-based routes
- **Tailwind CSS v4** - Utility-first styling
- **shadcn/ui** - Accessible component library (base-nova style)
- **Oxlint + Oxfmt** - Fast linting and formatting (replaces ESLint/Prettier)

## Project Structure

```
croissant-electron/
├── bin/                    # CLI entry points for project generator
├── build/                  # Electron builder config (entitlements, etc.)
├── resources/              # App icons and assets
├── src/
│   ├── main/               # Main process (Node.js/Electron APIs)
│   │   └── index.ts        # App entry, window creation, IPC
│   ├── preload/            # Preload scripts (secure bridge)
│   │   ├── index.ts        # Preload implementation
│   │   └── index.d.ts      # Type declarations for contextBridge
│   └── renderer/           # Renderer process (React app)
│       ├── index.html      # HTML entry point
│       └── src/
│           ├── main.tsx    # React root, router setup
│           ├── routeTree.gen.ts  # Auto-generated TanStack routes
│           ├── routes/     # File-based routing
│           │   ├── __root.tsx    # Root layout (theme, devtools)
│           │   ├── index.tsx     # Home route
│           │   └── examples/     # Example routes
│           ├── components/ # React components
│           │   ├── ui/     # shadcn/ui components
│           │   ├── theme-provider.tsx
│           │   ├── mode-toggle.tsx
│           │   └── Versions.tsx
│           ├── hooks/      # Custom React hooks
│           ├── lib/        # Utilities (cn, etc.)
│           └── styles/     # Global styles (app.css, Tailwind)
├── components.json         # shadcn/ui configuration
├── electron.vite.config.ts # Vite config for main/preload/renderer
├── electron-builder.yml    # Electron Builder config
├── tsconfig.json           # Base TypeScript config
├── tsconfig.node.json      # Node/TS config for main/preload
├── tsconfig.web.json       # Web/TS config for renderer
└── package.json
```

## Key Technologies & Patterns

### Electron Architecture

- **Main process** (`src/main/index.ts`): Creates BrowserWindow, handles app lifecycle, IPC
- **Preload script** (`src/preload/index.ts`): Secure contextBridge for renderer↔main communication
- **Renderer** (`src/renderer/`): React SPA with TanStack Router

### Routing (TanStack Router)

- File-based routing in `src/renderer/src/routes/`
- Route tree auto-generated to `routeTree.gen.ts`
- Root layout in `__root.tsx` wraps all routes with ThemeProvider + DevTools
- Use `createRootRoute`, `createFileRoute` from `@tanstack/react-router`

### Styling

- Tailwind CSS v4 via `@tailwindcss/vite` plugin
- Global styles in `src/renderer/src/styles/app.css`
- shadcn/ui components use CSS variables for theming
- `components.json` defines aliases: `@/components`, `@/lib/utils`, `@/components/ui`, `@/hooks`

### Component Library (shadcn/ui)

- Components in `src/renderer/src/components/ui/`
- Base style: `base-nova` (from components.json)
- Icons: `lucide-react`
- Add components via: `pnpm dlx shadcn@latest add <component>`

## Development Commands

```bash
# Install dependencies
pnpm install

# Development (starts Vite + Electron)
pnpm dev

# Type checking
pnpm run typecheck        # Both node + web
pnpm run typecheck:node   # Main/preload only
pnpm run typecheck:web    # Renderer only

# Linting & Formatting
pnpm run lint             # Oxlint
pnpm run lint:fix         # Oxlint --fix
pnpm run format           # Oxfmt
pnpm run fmt:check        # Oxfmt --check

# Build
pnpm run build            # Typecheck + electron-vite build
pnpm run build:unpack     # Build + electron-builder --dir

# Platform-specific builds
pnpm run build:win        # Windows
pnpm run build:mac        # macOS
pnpm run build:linux      # Linux
```

## Code Conventions

### TypeScript

- Strict mode enabled
- Path aliases: `@/` → `src/renderer/src/`
- Separate tsconfigs for node (main/preload) and web (renderer)

### React

- Functional components with hooks
- TanStack Router for navigation (not React Router)
- Use `Outlet` for nested routes

### Electron IPC

- Define types in `src/preload/index.d.ts`
- Expose via `contextBridge.exposeInMainWorld` in preload
- Call from renderer via `window.electronAPI.*`

### Adding shadcn/ui Components

```bash
pnpm dlx shadcn@latest add button dialog form
```

Components are added to `src/renderer/src/components/ui/`

## Important Files to Know

| File                                 | Purpose                               |
| ------------------------------------ | ------------------------------------- |
| `electron.vite.config.ts`            | Vite config for all three processes   |
| `src/main/index.ts`                  | Main process entry, window management |
| `src/preload/index.ts`               | Secure IPC bridge                     |
| `src/renderer/src/main.tsx`          | React app bootstrap                   |
| `src/renderer/src/routes/__root.tsx` | Root layout (theme, providers)        |
| `components.json`                    | shadcn/ui configuration               |
| `electron-builder.yml`               | Packaging configuration               |

## Common Tasks

### Add a New Route

Create file in `src/renderer/src/routes/` (e.g., `settings.tsx`), TanStack Router auto-generates route tree.

### Add a New IPC Channel

1. Add type to `src/preload/index.d.ts`
2. Implement in `src/preload/index.ts` via `contextBridge`
3. Handle in `src/main/index.ts` via `ipcMain.handle`
4. Call from renderer via `window.electronAPI.channelName()`

### Modify Theme

Edit `src/renderer/src/styles/app.css` (CSS variables) and `components.json` (baseColor).

### Update shadcn/ui Components

```bash
pnpm dlx shadcn@latest add -o button  # Overwrite existing
```

## Debugging

- **Main process**: VS Code debug config for Electron main
- **Renderer**: DevTools (F12 in dev), React DevTools, TanStack Router DevTools
- **Preload**: Console logs appear in renderer DevTools

## Generator CLI

The `bin/croissant-electron.js` creates new projects:

```bash
npx croissant-electron init my-app
```

## Environment

- Node.js 20+
- pnpm 9+
- macOS/Windows/Linux supported
