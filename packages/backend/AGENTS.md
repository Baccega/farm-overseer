# backend

Follow the root AGENTS.md.

Use Effect Services for business operations and Layers for repositories, database, authorization, configuration, and publication. Use typed errors for expected failures.
Each domain module has handlers, service, repository interface, and Drizzle implementation. Handlers validate and call services. Repositories own explicit SQL projections.
Mutations require authentication, authorization, expected versions, idempotency, and atomic entity/result/outbox writes. Do not expose generic table updates.
Own connections with Scope; process with Stream, bounded Queue, and Fiber. Close or resynchronize slow clients. Supervise publisher retries and release resources on shutdown. In-memory PubSub is not durable.
Keep durable jobs and their progress in PostgreSQL. Prefer efficient joins and indexes before Request batching. Never log secrets.
