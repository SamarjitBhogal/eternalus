# AGENTS.md: `@eternalus/protocol`

Package-specific rules. The root `AGENTS.md` still applies.

- The wire messages between the client and the Duel server (ADR 0016 point 6), and the server's
  parser for client messages (its trust boundary, ADR 0016 point 7).
- Pure TypeScript with no DOM or Node types: it imports only `@eternalus/core`'s types.
- Nothing here sends or receives; the transports live in `apps/server` and the client's
  `game/engine/net/`.
- Each class has its own file and test, as in core.
