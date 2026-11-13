# db

Follow the root AGENTS.md.

Own Drizzle PostgreSQL table definitions and reviewed migrations. Export schema separately from the node-only client. Do not add a root barrel that exports the client.
Add foreign keys, uniqueness, workspace indexes, and version constraints as needed. Use transactions for entity writes, mutation results, and outbox records.
Do not apply migrations or connect to a real database without task authorization. Generate migrations only after tables are reviewed. No tables or migrations exist yet.
