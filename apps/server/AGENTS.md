# AGENTS.md: `@eternalus/server`

Package-specific rules. The root `AGENTS.md` still applies. Design: ADR 0016
(`docs/decisions/0016-multiplayer-server-authoritative-duel.md`).

## Boundaries

- The online Duel server: one Node process (ADR 0016 point 2). It imports `@eternalus/core` and
  `@eternalus/protocol`; nothing imports it, and it never imports the client.
- The server is the trust boundary (ADR 0016 point 7): every client message goes through
  `ClientMessageParser` and the per-connection `TokenBucket`; the actor of every command is
  stamped from the connection's seat, never read from the client.
- Node APIs are allowed here, behind ports: `transport/WsListener.ts` is the only file importing
  `ws`, `logging/StdoutLogger.ts` the only one writing to `process.stdout`, and `time/` the only
  place using timers or the clock.
- Run with `npm run build -w @eternalus/server` then `npm run start -w @eternalus/server`;
  `DUEL_HOST` / `DUEL_PORT` choose the listener (default `127.0.0.1:8787`); `/health` answers on
  `127.0.0.1:8788`.

## Folders

| Folder       | Holds                                                                   |
| ------------ | ----------------------------------------------------------------------- |
| `config/`    | `ServerConfig`: environment variables to listener options               |
| `gateway/`   | `DuelGateway`: per-connection parsing, rate limits and routing          |
| `limits/`    | `TokenBucket`                                                           |
| `logging/`   | `StdoutLogger`, core's `Logger` port as JSON lines                      |
| `match/`     | `DuelHost`, `DuelMatch`, the `DuelSimulation` port and its core adapter |
| `queue/`     | `DuelQueue`: first-come pairing                                         |
| `time/`      | The `Clock` and `TickScheduler` ports, their system adapters and fakes  |
| `transport/` | The `ClientConnection` port, the `ws` adapters and a fake               |
| `bots/`      | Dev tool: scripted Duel players (`npm run duel:bots`), A\* via core     |
| `main.ts`    | The composition root                                                    |

## Bots (dev tool)

`npm run duel:bots -- --url ws://127.0.0.1:8787 --players 2 --seconds 20 --stagger 200` plays
scripted Duel players against a running server: matchmaking checks plus chase and combat, using
core's `MatchPathfinderFactory` on the map regenerated from `match-found.seed`. It uses Node's
`WebSocket` (not `ws`); `bots/main.ts` is its entry and owns argv, std streams and exit code.

## Tests

- Each test sits next to its source; tests use the fakes, never real sockets or timers.
- Coverage thresholds (85%) live in `vitest.config.ts` and only go up.
