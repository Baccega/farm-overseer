# Architecture and delivery plan

Accepted direction: user architecture request, 2026-11-13. Farm Overseer is a temporary name.

## Scope

Manage farms: satellite-backed field boundaries; plant, pole, sensor and irrigation positions; inventory with map locations and photos; recurring treatments and completion history; staff; per-field and per-plant statistics; observations and estimates with explicit uncertainty. Providers, authentication, map storage, photo storage, and production deployment are not selected.

## Layout

The requested packages/frontend and packages/backend replace apps/web and apps/api in the illustrative plan. packages/common owns public contracts; packages/db owns persistence; packages/api-client owns typed HTTP calls. There is one backend process and PostgreSQL in V1.

## Client engine

Entity Store holds normalized confirmed entities. Mutation Manager tracks commands and policies. Optimistic Layer combines confirmed entities with pending changes. Sync Manager applies server events and recovers gaps. Typed API Client sends HTTP requests.
Mutation states: queued -> sending -> awaiting-sync -> confirmed; sending or awaiting-sync can fail or conflict. Confirmation is terminal. An event may arrive before its HTTP response. Independent entities can proceed in parallel; dependent writes must be ordered. Use unique mutation IDs, idempotency keys, expected versions, explicit execution policies and confirmation rules.
Rename, descriptions, and settings can be optimistic. Deletion and permission changes wait for confirmation. React uses narrow selectors and typed commands.

## Snapshot and replay

Load authorized application data at startup with one snapshot and opaque replay cursor. The snapshot/stream handoff must have no race. Reconnect with replay; load a new snapshot if retention cannot cover the gap. Validate event order, IDs and versions. Filter all data by workspace and authorization; revoke local access when permissions change.
A PostgreSQL sequence alone does not establish commit order. Before implementing sync, specify and test a durable committed ordering mechanism and a consistent snapshot boundary. Do not publish a numeric placeholder cursor as a correct protocol.
Use a durable PostgreSQL outbox. Publisher and consumers tolerate duplicates. Effect Scope owns connections, Stream handles processing, bounded Queue holds outgoing messages, and Fiber runs connection tasks. Resynchronize or close slow clients.

## Background work and scale

Use scoped fibers and schedules for short tasks and retries. Persist restart-safe job state and expose progress as synchronized entities. Prefer SQL joins/indexes; use Effect Request batching when repeated lookups remain.
Keep handlers stateless. Start with one backend. Add a distributed event bus only when multiple instances serve subscriptions. Add pagination and partial subscriptions only after measurements show need. Measure HTTP latency, mutation confirmation time, outbox lag, database load, and reconnect frequency.

## Build order and current status

The workspace has package boundaries, a sample-data farm overview, a field editor prototype, a typed health API/client, and an Effect server entry point. The field editor uses OpenStreetMap tiles and keeps drawn boundaries, plants, and poles in browser memory for the current session. Grid spacing uses a local meter projection and follows the first boundary edge. There are no domain tables, migrations, authentication, server mutations, outbox, WebSockets, or sync engine yet.

1. Define tables and generate reviewed migrations.
2. Derive Effect row schemas with a version-compatible adapter; select public fields.
3. Define explicit entities, commands, events, and snapshot contracts.
4. Extend the typed Effect HTTP API and client.
5. Add Services, Layers, repository interfaces and Drizzle implementations.
6. Add normalized Zustand state, Immer updates, and narrow selectors.
7. Add generic Mutation Manager and optimistic overlays.
8. Specify and implement WebSocket replay and consistent snapshots.
9. Add transactional outbox and publisher before enabling live mutations.
10. Add tracing, behavior/authorization tests, and measurements.

First vertical slices: optimistic project rename and confirmed project deletion using the same engine. Projects are the technical reference domain; mapping them to farms or workspaces requires a domain decision. Test rollback, authorization, version conflicts, retries, event-before-response, duplicate delivery, reconnect gaps, revocation, and slow clients.

References: https://orm.drizzle.team/docs/effect-schema and https://effect.website/docs/v3/api/platform/HttpApiBuilder . Match examples to installed versions; do not assume current documentation uses the installed Effect major.

## Development tools

The pnpm workspace uses project-local Vite+ for frontend development, builds, tests, lint, formatting and workspace task execution. Backend development continues to use tsx and the Effect Node runtime; backend builds use TypeScript, not browser bundling.
