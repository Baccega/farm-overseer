# frontend

Follow the root AGENTS.md.

Use React 19, TypeScript, Zustand, and Immer. Do not add TanStack Query for synchronized entities.
Keep components free of HTTP, WebSocket, and Effect operations. Components call typed commands and use narrow selectors. Preserve references for unchanged entities.
Store normalized confirmed entities by type and ID. Store mutations and UI state separately. Calculate optimistic values in selectors.
The Mutation Manager owns execution, retries, cancellation, timeouts, and terminal states. Effect is optional inside it. Use mutation IDs and idempotency keys. Order dependent writes per entity or field; independent writes may run in parallel. A confirmed mutation cannot return to pending if an HTTP response arrives late.
The Sync Manager owns event validation, cursor/order/version checks, deduplication, replay, and snapshot recovery. Transport owns connections. Remove entities when access is revoked.
