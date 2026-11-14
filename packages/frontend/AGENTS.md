# frontend

Follow the root AGENTS.md.

Use React 19, TypeScript, Zustand, and Immer. Do not add TanStack Query for synchronized entities.
Keep components free of HTTP, WebSocket, and Effect operations. Components call typed commands and use narrow selectors. Preserve references for unchanged entities.
Store normalized confirmed entities by type and ID. Store mutations and UI state separately. Calculate optimistic values in selectors.
The Mutation Manager owns execution, retries, cancellation, timeouts, and terminal states. Effect is optional inside it. Use mutation IDs and idempotency keys. Order dependent writes per entity or field; independent writes may run in parallel. A confirmed mutation cannot return to pending if an HTTP response arrives late.
The Sync Manager owns event validation, cursor/order/version checks, deduplication, replay, and snapshot recovery. Transport owns connections. Remove entities when access is revoked.

## React 19 practices

- Keep render pure and treat props, state, Hook inputs and JSX values as immutable. Follow the Rules of Hooks. Use Strict Mode. [React rules](https://react.dev/reference/rules)
- Derive display values during render. Handle user actions in event handlers. Use Effects for external synchronization and clean them up; do not mirror derived state in Effects. [React Effects guidance](https://react.dev/learn/you-might-not-need-an-effect)
- Subscribe to narrow, stable Zustand selections. External store snapshots must be stable while unchanged, and subscriptions must clean up. [React external stores](https://react.dev/reference/react/useSyncExternalStore)
- Keep typed commands outside components. The mutation engine owns optimistic state; do not add a second authority with useOptimistic. Pass refs as props where appropriate in React 19. Do not add memoization without a demonstrated need. Do not require Next.js or server actions.
- Use the semantic CSS variables and Tailwind v4 theme for shadcn components. [shadcn Tailwind v4](https://ui.shadcn.com/docs/tailwind-v4)

Use the project-local Vite+ CLI through pnpm. Run `pnpm test`, `pnpm lint`, and `pnpm check` from the workspace root. Oxlint checks the Rules of Hooks and Effect dependencies; keep these checks enabled.
