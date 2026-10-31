---
title: 0025. Error reports through the local dev server
description: Proposed record of the owner's decisions DEC-106, DEC-115 and DEC-116 - every crash and error becomes one JSON report in logs/errors/, written by a small Vite plugin that runs only in the dev and preview servers, through one replaceable ReportWriter behind the client's logging with a copy fallback, fed by a core replay export and recent-history read, plus one class ErrorBoundary as the only exception to "function components only"; read this before changing the crash path, the logging sinks, the Vite config or the ErrorBoundary.
audience: [humans, agents]
status: draft
owner: sholtzman
last-reviewed: 2026-10-30
tags: [adr, diagnostics, crash-reports, logging, vite, error-boundary, replays]
related:
  - 'docs/reference/game-design/13-owner-decisions-log.md'
  - 'docs/architecture/15-diagnostics-and-runtime-testing.md'
  - 'docs/architecture/13-game-interface.md'
  - 'docs/architecture/03-game-model.md'
  - 'docs/architecture/02-code-structure.md'
  - 'docs/requirements/05-engineering-standards.md'
  - 'docs/decisions/0019-session-controller-owns-the-match.md'
  - 'apps/client/AGENTS.md'
---

# 0025. Error reports through the local dev server

- Status: proposed (drafted 2026-10-30 for DEC-106, DEC-115 and DEC-116; nothing is built until
  the product owner accepts it, `INBOX.md` HC-Q27)
- Date: 2026-10-30

## Context

**The owner's decisions** (read the rows in the decisions log). DEC-106: a crash returns the
player to the menu with a message; every error and crash is one traceable report file in
`logs/errors/` (out of git), written by "the local game server", with a copy fallback; a database
later changes only the writer. It lists the report contents (used in §3) and splits crashes (ask
for a note) from silent errors (failed loads, broken saved data, runtime-check failures). DEC-107:
served locally only. DEC-115: one class `ErrorBoundary`. DEC-116: an endpoint only in the Vite dev
and preview server; build order core, writer, popup.

**What exists (checked at `1f5cb75`).**

- `cca838d`: `GameLoop` wraps tick and render in `try`/`catch`, destroys itself and calls
  `LoopTarget.crashed`. `Match.crashed` → `onCrash({ error, tick })` → `MatchState` →
  `SessionContext.endCrashedMatch`, which logs FATAL `client.session` (error, stack, seed, tick)
  and goes to `menu` with `SessionReason` `'match-crashed'`. `ui/strings.ts` shows the banner.
- Core: `GameState` keeps the last 512 applied commands (player and bot) and `GameEvents` the last
  512 events (`RingBuffer`). Only `InvariantRunner` reads them; it copies the last 32 and 128
  (`REPORTED_COMMANDS`, `REPORTED_EVENTS`) into `LogRecord.context`. `Replay`, `recordReplay`
  and `runReplay` exist for test fixtures.
- Client: `SinkLogger`, `ConsoleSink`, `RingBufferSink` in `data/logging/`. Each match has a TRACE
  ring of 512 records (`createBrowserMatch`); the page logger in `main.tsx` has none.
- Missing: `Simulation.exportReplay()` (designed in 03 §6, not built per 03 §12); a log of every
  externally enqueued command; a public read of recent commands and events; any content version
  (15 §13); the writer, the endpoint, the `ErrorBoundary`, a `window` error listener; `logs/` in
  `.gitignore` (only `*.log` today).

**Constraints.** Root `AGENTS.md`: "browser-only ... no server"; core is pure with no `Date` or
timers (rules 1, 8); persisted data goes through `PersistenceController` (rule 13).
`apps/client/AGENTS.md:42`, `CONTRIBUTING.md` §5 and 13 §7: "Function components only". ES-06
and 13 §3: error boundaries wrap every screen; 13 §3 sends a match throw to `results`, which
DEC-106 replaces with the menu. ES-08: the browser is the trust boundary.

## Decision

### 1. The endpoint is a Vite plugin (DEC-116)

- `apps/client/errorReportsPlugin.ts` (with `.constants.ts` and `.test.ts`) sits beside
  `vite.config.ts`, which adds `errorReportsPlugin({ dir: <repo root>/logs/errors })`. The files
  join `tsconfig.node.json` and the Vitest `include`. No new folder.
- The plugin uses the hooks `configureServer` (`vite`) and `configurePreviewServer`
  (`vite preview`). Both exist in the installed Vite 8.3.1 (`ServerHook` gets a `ViteDevServer`,
  `PreviewServerHook` a `PreviewServer`). It adds one middleware to `server.middlewares` in the
  hook. It does not depend on the order of Vite's own middlewares, nor on Vite's request checks
  (`cors` and the `allowedHosts` host check): it makes every check it needs itself (§2).
  `vite build` never calls these hooks: `dist/` has no endpoint.
- Why this is not "a server" in the `AGENTS.md` sense: the game still runs with no server. The
  page needs no endpoint to play; without it, reports fall back to copy (§3). The plugin is dev
  tooling, like HMR. It holds no game state, no game rule and no player data. The rule's line
  gains one clause: "no game server (the dev and preview servers take error reports, ADR 0025)".
- Rule 13 does not change. A report is log output, like `ConsoleSink`, not saved player data.

### 2. Request contract

| Item       | Contract                                                                                                                |
| ---------- | ----------------------------------------------------------------------------------------------------------------------- |
| Save       | `POST /__eternalus/error-reports`, `Content-Type: application/json`, body = one `ErrorReport` (§3)                      |
| Note       | `POST /__eternalus/error-reports/<id>/note`, body `{ "note": string }`, at most 2,000 characters (`TUNE`)               |
| Size limit | 16 MiB per body (`TUNE`: a 20-minute match's command log), counted while reading; stop at the limit                     |
| Saved      | `201` `{ "id": "<name without .json>", "file": "logs/errors/<name>" }`; the note route answers `200` with the same body |
| Refused    | `{ "error": "<reason>" }` with `405`, `403`, `415`, `413`, `400`, `404` (note: no such id), `500` (write failed)        |

Checks at the trust boundary, in this order: the method is `POST` (405). The peer address is
loopback (`127.0.0.1`, `::1`, `::ffff:127.0.0.1`) (403), so `vite --host` does not open it to
the network. The `Host` header names `localhost`, `127.0.0.1` or `[::1]`, with any port (403).
This stops DNS rebinding: a page from another site that points its own name at `127.0.0.1` sends
a loopback peer and a matching `Origin`, but its own name as `Host`. An `Origin` header, when
sent, equals `http://` plus the `Host` header (403), so a page from another site cannot write.
The content type is JSON (415). The body fits the limit (413). It parses as JSON (400). Its shape is an object with `schemaVersion` 1, `kind` `'crash'`
or `'error'` and a string `error.message` (400). The server reads nothing else from the body and
never takes a path from it. It writes `JSON.stringify(report, null, 2)` plus its own `receivedAt`.

**File name.** The server picks it: `<receivedAt>-<kind>-<id8>.json`, for example
`2026-10-30T22-41-07-123Z-crash-3f9a1c2e.json`. `receivedAt` is the server's UTC ISO time with
`:` and `.` replaced by `-` (sorts by time; valid on Windows). `id8` is 8 hex digits from
`crypto.randomBytes(4)`. The server creates the folder and writes with flag `wx` (never
overwrites). The note route accepts an `<id>` only if it matches that exact pattern and names an
existing file. It reads the file, sets `note`, writes a temporary file and renames it. The server
prints one line per saved report through Vite's logger. `now` and the random id are injected, so
tests are deterministic.

`Recommendation:` two requests. A crash report is saved at once, without a note; the note follows.
A tab closed while the popup is open still keeps the report. One write when the popup closes is
simpler, but it loses that report.

### 3. Client side: one writer behind the client's logging

- **Report.** `ErrorReport` (`data/logging/ErrorReport.types.ts`), `schemaVersion: 1`:
  `kind`; `createdAtMs` (wall clock from an injected `now`, as `PersistenceController` does);
  `error: { message, stack | null, source }`, where `source` is `'game-loop'`,
  `'screen:<ScreenName>'` or the log scope; `record` (the `LogRecord` behind a silent report, else
  `null`); `match: { seed, tick, recentCommands, recentEvents, replay } | null`; `logTail` (the
  last 64 records, `TUNE`); `environment: { gameVersion, commit, contentVersion: null, userAgent }`;
  `note | null`.
- **Port.** `ReportWriter` (`data/logging/ReportWriter.types.ts`): `save(report)` and
  `addNote(id, note)`, each resolving to `{ id, file }` or rejecting. `ReportWriter.contract.ts`
  is its shared suite (09 §9). Adapters: `DevServerReportWriter` (`fetch` injected; a network
  error, a non-2xx answer or a 5 s timeout, `TUNE`, rejects) and `MemoryReportWriter` (test
  double). A database later is one new adapter and one line in `main.tsx` (DEC-106).
- **Reporter.** `ErrorReporter` (`data/logging/ErrorReporter.ts`) implements `LogSink`.
  `write(record)` is the silent path (§6); `reportCrash(crash)` is the crash path. It builds the
  report from injected parts: the writer, `now`, the environment, a page `RingBufferSink` tail, and
  `matchEvidence: () => MatchEvidence | null` from `SessionController`, which owns the match (ADR
  0019). `RunningMatch` gains `evidence()`; `createBrowserMatch` fills it from the `Simulation`
  (§4) and the match's TRACE ring. Each call resolves to `{ status: 'saved', id, file }` or
  `{ status: 'copy', text }` (the report as JSON). It never throws and catches every promise. It
  never reports records of its own scope, `client.reports`, so it cannot loop.
- **Copy fallback.** When `save` rejects, the popup shows a Copy button
  (`navigator.clipboard.writeText`; `localhost` is a secure context) and a read-only text box as
  the last resort. The copied text includes the note. A silent report that cannot be saved goes to
  the console as WARN `client.reports` with the full text.
- **Versions.** `Recommendation:` Vite `define` sets the root `package.json` version and the git
  commit at serve and build time. `contentVersion` stays `null` until core has one.
- **Where.** `data/logging/`: the folder of the sinks (15 §1, 09 §8), and `data/` is the client's
  I/O layer. 02 §3 lists no `data/logging/` row today; it gains one. Not `game/` (session flow
  only calls the reporter) and not `ui/` (rule 5).

### 4. Core side: replay export and recent history

- **Command log.** `Simulation.enqueueCommand` appends `{ tick: this.tick, command }` to a private
  array. Only external commands enter there (player, developer menu). Bot commands enter through
  `AiSystem`'s internal queue and are regenerated from the seed on replay (15 §7); logging them
  would apply them twice.
- **Checkpoints.** `Simulation.step()` records `{ tick, hash }` every `REPLAY_CHECKPOINT_EVERY`
  ticks (`TUNE` 300, 10 s at 30 TPS) in `diagnostics/Replay.constants.ts`. `runReplay` needs at
  least one checkpoint to advance, and checkpoints prove that the replay reproduces the match.
- **`Simulation.exportReplay(): Replay`** (03 §6): seed, config, a copy of the log, the
  checkpoints so far. It does not hash at export: after a throw inside `step()` the state holds
  half a tick, and that hash could never be reproduced.
- **`Simulation.recentContext(): LogContext`**: the last 32 applied commands (player and bot) from
  `GameState`'s ring and the last 128 events from `GameEvents`'s ring. The slicing moves into
  `diagnostics/recentContext.ts`, which `InvariantRunner` also calls (one place). `index.ts`
  exports `LogContext`.
- **Determinism.** These methods only read state or copy plain data. No `Date`, no timers. The log
  and the checkpoints are outside the hashed state. Wall time comes from the client only.

### 5. The `ErrorBoundary` exception (DEC-115)

- One class component in the codebase: `apps/client/src/ui/components/ErrorBoundary.tsx` (13 §1
  already lists it), with `getDerivedStateFromError` and `componentDidCatch`. The rule becomes
  "Function components only, except the one `ErrorBoundary` class (ADR 0025)" in
  `apps/client/AGENTS.md`, `CONTRIBUTING.md` §5 and 13 §7. No lint rule enforces function
  components (`eslint.config.js` checked), so no guardrail config changes.
- **Where.** One instance in `ui/App.tsx` around the current screen, keyed by phase and menu route,
  so it resets when the screen changes. The HUD renders inside `MatchScreen`, so it is covered.
  The crash popup sits outside the boundary in `App`, as `SelectTimeoutNotice` does.
- **What it catches.** A throw while React renders a screen or runs its lifecycle methods. It shows
  an empty screen and emits `ui-intent` `{ kind: 'report-screen-crash', screen, message, stack,
componentStack }` (plain strings; `ui/` never imports `game/` or `data/`). React types
  `ErrorInfo.componentStack` as `string | null | undefined` (`@types/react` 19.3), so the boundary
  sends `''` when React gives none.
- **What `LoopTarget.crashed` catches.** A throw from a tick or a frame. The game loop runs in
  `requestAnimationFrame` callbacks, outside React, so no boundary sees it. Event handlers and
  async code reach neither; §6 covers them with `window` listeners.
- **Handling.** `SessionController` takes `report-screen-crash`. In `match` it follows
  `endCrashedMatch` (destroy, FATAL, report with source `screen:<Name>`, menu, `'match-crashed'`).
  In other phases it reports and returns to the menu (message: open question Q2). A second crash
  of the same screen keeps the same key, so the boundary stays on its fallback: no loop.

### 6. Silent errors

`Recommendation:` the rule table in `ErrorReporter.constants.ts`:

| Report without a note                                                                                                     | Why                                             |
| ------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------- |
| Every ERROR or FATAL record, any scope, except FATAL `client.session`                                                     | the crash path reports that record; never twice |
| WARN `client.resources` (`asset failed`, `asset rendition failed`)                                                        | DEC-106 "failed loads"                          |
| WARN `client.persistence` (`record quarantined`), WARN `client.settings` (`settings could not be loaded; using defaults`) | DEC-106 "broken saved data"                     |
| `core.invariants` at ERROR or FATAL (all six invariants today)                                                            | DEC-106 "runtime-check failures"; first row     |
| ERROR `client.window`: `window` `error` and `unhandledrejection`, new listeners in `main.tsx`                             | throws that no boundary or loop catches         |

Not reported: INFO `core.commands` (rejected commands), WARN `client.views` (a kind drawn with the
default view). Dedupe: one report per scope, event name and body per page load; at most 20 silent
reports per page load (`TUNE`). An invariant that breaks every tick makes one report, not 30 a
second. **Open question Q1 for the owner.**

### 7. Alternatives considered (all rejected)

- **File System Access API:** Chromium only; a click and a permission prompt each session, so
  silent errors cannot write.
- **Download a file:** it lands in Downloads, not `logs/errors/`; silent errors start surprise
  downloads.
- **IndexedDB with export:** reports stay in the browser where agents cannot read them; a crash in
  persistence itself can lose them.
- **A separate Node server:** a second process, port and CORS set-up beside Vite, for the same
  file write.
- **React 19 root `onUncaughtError`, or a boundary package:** the first unmounts the whole tree, so
  no menu shows without a remount; the second is a new dependency.

### 8. Build order and tests (one lane, after acceptance)

Every test fails first on a recorded break (memory rule "tests must fail first").

1. **Core.** Command log, checkpoints, `exportReplay()`, `recentContext()`. Tests: a match with
   player commands and bots, exported and run with `runReplay`, has no divergence and the same
   final hash; the log holds no bot command (break: log bot commands, the replay diverges); a
   JSON round trip of the export runs the same; `recentContext()` gives the newest 32 and 128;
   calling the readers every tick leaves every hash unchanged; `InvariantRunner` still passes.
2. **Writer.** Plugin, `ErrorReport`, `ReportWriter` and its contract, both adapters,
   `ErrorReporter`, `RunningMatch.evidence()`, `main.tsx` wiring, `.gitignore` `logs/`. Tests:
   plugin with fake requests and a temporary folder: `201`, file name pattern, content plus
   `receivedAt`, every refusal code, a foreign `Host` is refused, the size limit stops reading, a
   `../` id is refused, the note rewrite; the writer with a fake `fetch`: saved, `404`, rejection
   and timeout give `copy`; the reporter: each rule row in and out, dedupe, the cap, no
   self-report, a crash reported once; `vite.config.test.ts`: the plugin is present.
3. **Popup.** `ErrorBoundary`, `crash-report` bridge event and session state, the popup that
   replaces the `'match-crashed'` banner (DEC-106 text and buttons), intents `save-crash-note` and
   `dismiss-crash-report`. Tests: popup states rendered on the server (asking, saving, saved,
   copy); the boundary under happy-dom (DEC-111, per file; server rendering does not run
   boundaries) emits one intent and shows the fallback; `SessionController` end to end: a screen
   crash in a match ends it with 0 frames and 0 listeners, and the report holds the replay.

### Documents amended on acceptance

Root `AGENTS.md` ("no server" clause, §1); `apps/client/AGENTS.md`, `CONTRIBUTING.md` §5 and 13
§7 (the exception, `INBOX.md` HC-T1 T-208); 13 §3 (menu and popup, not `results`); ES-06 in
`05-engineering-standards.md` ("recoverable results/error screen" becomes the menu and the
popup); 15 §4, §5 and §13 (reporter, writer, reports); 02 §3 (`data/logging/`, the plugin); 03
§12 (`exportReplay()` built); `.gitignore`.

## Consequences

- **Easier.** A crash or an error becomes a file that people and agents read in the repository,
  with a replay that reproduces the match. The dev menu's "dump replay" and FR-092's match
  replay reuse `exportReplay()`. A database later replaces one adapter.
- **Harder.** The dev server now has a write path; it stays loopback-only and size-limited. One
  class component needs its own rule line. The client gains a port, two adapters and a reporter.
- **Watch.** `logs/errors/` grows without limit (delete by hand); each worktree has its own. A
  report may hold the note, names and the browser string; it stays local and out of git. The
  command log grows for the whole match (a few MB at worst, `[Inferred]`). The replay is valid
  only for the default content, `levelCurves` and systems, which the browser match uses today.
  Served by another static server, every report falls back to copy. `server.allowedHosts: true`
  turns Vite's own host check off (Vite's types warn of DNS rebinding); the plugin's `Host` check
  (§2) still holds, so never remove it. With `server.https`, the `Origin` check (`http://` only)
  refuses every report, and the page falls back to copy until that check learns `https://`.

## Open questions for the owner

1. **Q1, silent errors:** is the §6 table the right set? `Recommendation:` yes, as written.
2. **Q2, a screen crash outside a match:** which menu message? `Recommendation:` a new reason
   `'screen-crashed'` with "The screen stopped because of an error.", and the same note popup.
3. **Q3, copy mode text:** `Recommendation:` "The report could not be saved. Copy it and send it to
   the team." with a "Copy report" button beside DEC-106's two buttons.
