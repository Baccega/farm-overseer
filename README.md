# Farm Overseer

Temporary name for a shared farm management application. The frontend contains a sample-data overview; domain services are not implemented. See [architecture](docs/architecture.md) for scope, boundaries, sync rules, and build order.

## Setup

Use Node 24 and Corepack/pnpm (the root package.json pins pnpm).

- pnpm install --frozen-lockfile
- pnpm test
- pnpm lint
- pnpm check
- pnpm typecheck
- pnpm build

Vite+ is installed locally; `pnpm exec vp` needs no global CLI. `pnpm format` formats the workspace. The workspace task runner executes package scripts in dependency order.

After acquiring a Pawffice dev-stack slot, run pnpm dev:frontend and pnpm dev:backend in separate terminals. Frontend defaults to localhost:5173; the backend binds localhost:3001 and serves GET /health. Set PORT to change the backend port. No database is required for the scaffold. No server is started by install or build.

Packages: frontend (React 19, Zustand, Immer); backend (Effect HTTP/Services/Layers); common (Effect Schema contracts); db (Drizzle/PostgreSQL); api-client (typed Effect HTTP client). Each package has its own AGENTS.md.

Repository: https://github.com/Baccega/farm-overseer

No deployment, authentication, domain tables, live synchronization, or business operations are configured.
