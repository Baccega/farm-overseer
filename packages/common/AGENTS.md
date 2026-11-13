# common

Follow the root AGENTS.md.

Own public entities, commands, events, snapshots, and the Effect HTTP API. Infer TypeScript types from runtime schemas.
Derive basic row schemas from db/schema using a compatible Drizzle-to-Effect adapter. Select public fields explicitly with Schema.pick or Schema.omit; compose computed fields with Schema.extend. Verify APIs against installed versions before use. Do not expose whole rows by default.
Use explicit mappings for entities built from several tables. Commands specify permitted business inputs, expected version, mutation ID, and idempotency key. Events specify event ID, workspace, entity version, mutation correlation, and opaque durable cursor. No private data or server dependencies.
