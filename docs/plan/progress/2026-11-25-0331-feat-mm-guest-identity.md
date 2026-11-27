---
title: 'Progress 2026-11-25: feat/mm-guest-identity'
description: 'Phase 3 / sprint 3, claudiodh + Claude Code: automatic Duel reconnect (DEC-349), the held-opponent order in PresenceBook.disconnect, the health probe port, and a phase/3 merge (PR #104 reviews of 2026-11-23 and 2026-11-25).'
audience: [humans, agents]
status: active
owner: claudiodh
last-reviewed: 2026-11-25
tags: [plan, progress, log]
---

# Progress 2026-11-25: feat/mm-guest-identity

Phase 3 / sprint 3 · feat/mm-guest-identity (PR #104) · claudiodh + Claude Code

- What was done: answered swholtzman's re-review of 2026-11-23, SamarjitBhogal's review of
  2026-11-25 and Copilot's two inline comments.
  - DEC-349 (the owner's answer of 2026-11-23, quoted) recorded; the DEC-297 row gets an appended
    note that DEC-349 amends it; FR-118 stays in sprint 4.
  - Client reconnect: `DuelSession` has a `reconnecting` state. A drop once paired retries with
    back-off (`RECONNECT_BACKOFF_MS`, `// TUNE:`) and the seat's guest id until the server sends
    `match-found` again (the same Duel goes on, no new loading) or the window ends (`lost`). An
    attempt the server queues leaves the queue and tries again. A `match-found` while a Duel runs
    changes nothing. `RECONNECT_WINDOW_MS` moved to `@eternalus/protocol` so both ends share it.
  - HUD: the bridge event `duel-connection` feeds `matchSlice.isReconnecting`;
    `ReconnectingNotice` shows "Reconnecting..." in `MatchScreen`.
  - Server: `PresenceBook.disconnect` resolves an already-held opponent before the held-guest cap,
    so the first leaver still loses when the cap is full (test added). The Dockerfile health probe
    reads `OPS_PORT` (default 8788).
  - Docs: the multiplayer plan's implementation status (only rated guests keep their id; the
    client reconnects) and question 44; doc 13's phase table; `INBOX.md` SCRUM-430 (a new team
    question: the 15 s heartbeat is longer than the 10 s window); the `MAX_KNOWN_GUESTS` comment
    says "rated"; merged `phase/3-sprint-3-work`.
- Checks run: `npm run check:quick` passed; `npm run docs:check` → `Documentation check passed.`;
  vitest: client duel, session, bridge and HUD files `Tests  249 passed (249)` and
  `SessionController*` `Tests  138 passed (138)`, server `Tests  155 passed (155)`, protocol
  `Tests  31 passed (31)`. The full `npm run check` was not run.
- Next step: the critic (pre-PR gate) on the reconnect diff; swholtzman and SamarjitBhogal
  re-review; the owner answers how long a remembered guest id lives and the heartbeat question.
