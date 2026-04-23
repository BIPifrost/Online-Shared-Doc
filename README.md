# online-shared-doc

`online-shared-doc` is the workspace scaffold for the online shared document course project. Task1 establishes the fixed directory layout, root scripts, and the minimum runnable frontend/backend setup required by later tasks.

## Workspace Layout

- `client/`: React + Vite + TypeScript frontend workspace.
- `server/`: Express + TypeScript backend workspace.
- `shared/`: shared TypeScript definitions reserved for Task2.
- `docs/`: API, database, testing, and report support materials.

More detailed directory responsibilities are documented in [docs/project-structure.md](docs/project-structure.md).

## Quick Start

1. Install all workspace dependencies from the repository root:

   ```bash
   npm install
   ```

2. Start the backend only:

   ```bash
   npm run dev:server
   ```

   The current Task1 backend `dev` script compiles the server first and then
   launches `dist/index.js`. This keeps the startup path stable while the
   project is still in scaffold stage.

3. Start the frontend only:

   ```bash
   npm run dev:client
   ```

   The current Task1 frontend startup flow builds the client workspace from the
   root script and then serves `client/dist` through a lightweight local preview
   server. This keeps the React + Vite scaffold stable in the current local
   environment.

4. Start both together:

   ```bash
   npm run dev
   ```

5. Build both workspaces:

   ```bash
   npm run build
   ```

## Default Ports

- Frontend preview server: `5173`
- Backend HTTP server: `3001`

The frontend workspace keeps the Vite configuration in place, including the
`/api`, `/socket.io`, and `/yjs` proxy targets needed for later tasks. Task1
uses a stable preview-based startup path while leaving the project on the
required React + Vite foundation.

## Current Scope

Task1 intentionally includes only the minimum runnable shell:

- fixed directory skeleton
- root workspace scripts
- minimal React application entry
- minimal Express server entry
- startup and structure documentation

Task2 and later tasks will fill in shared types, database logic, APIs, real-time collaboration, and UI features.
