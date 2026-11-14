# Farm Overseer

Use simple technical English. Read this file and the package AGENTS.md before changes.
Do not stage, commit, push, deploy, or change infrastructure unless the user authorizes it.

## Package boundaries

- frontend: React 19 UI and Zustand observable state. Import common and api-client only.
- backend: one modular Effect HTTP server. Import common and db. No microservices or broker in V1.
- common: public Effect Schema contracts. Import db/schema only when deriving schemas. Never import db/client, repositories, Node APIs, or server configuration.
- db: PostgreSQL tables, migrations, and a separate server-only client export.
- api-client: typed HTTP operations from common. No UI state or business rules.
  Use package exports. Do not use relative imports across packages. Keep browser bundles free of server code.

## Contract and mutation rules

Drizzle tables -> derived Effect schemas -> explicit public projections -> typed REST and events -> inferred UI types. Select public fields explicitly. Define business commands separately from database update schemas. Validate all untrusted input at runtime. Use SQL constraints and authorization tests too.

REST carries commands and snapshots. WebSockets carry committed updates. Authenticate and authorize every command, snapshot, subscription, and replay. Check expected entity versions. In one transaction, update data, save the idempotent mutation result, and append an outbox event. Publish only committed events. Tolerate duplicate delivery.

Keep confirmed entities, pending mutations, and local UI state separate. Optimistic overlays must not modify confirmed data. Use optimistic rename and confirmed deletion as the first two complete operations through the same generic engine. Do not add fake persistence or an in-memory substitute for a durable outbox.

Read docs/architecture.md for sync, resource, and implementation rules. Keep implementation status accurate. Run pnpm typecheck and pnpm build after code changes. Add behavior and authorization tests when those operations exist. Do not start services without acquiring the Pawffice dev-stack slot.
