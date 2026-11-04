---
title: 0019. SessionController owns the Match
description: Record of the owner's decision DEC-50, accepted 2026-10-28 - SessionController owns the Match lifetime, match-loading only loads the match assets and prepares the world, and the Match is built through an injected factory when the match screen attaches its viewport and destroyed on leaving the match - amending architecture 13 §2, where the Match was created in match-loading; read this before changing the session phases, the match factory, GameCanvas or anything that creates or destroys a Match.
audience: [humans, agents]
status: active
owner: sholtzman
last-reviewed: 2026-10-28
tags: [adr, session, match, lifecycle, client]
related:
  - 'docs/architecture/13-game-interface.md'
  - 'docs/reference/game-design/13-owner-decisions-log.md'
  - 'docs/changelog/pr-feat-hud-and-character-select.md'
  - 'apps/client/AGENTS.md'
---

# 0019. SessionController owns the Match

- Status: accepted (product owner decision in chat, 2026-10-28; drafted 2026-10-27 to record the
  owner's decision DEC-50 of 2026-10-17, which `feat/hud-and-character-select` implements; on
  acceptance `INBOX.md` HC-T1 rows T-01, T-07, T-08, T-14, T-15 and T-86 were applied, and T-16
  waits for HC-F9 and HC-Q8)
- Date: 2026-10-27

## Context

Architecture [13 §2](../architecture/13-game-interface.md#2-sessioncontroller) designs
`SessionController` as the state machine over the session phases. Its sketch injects
`createMatch: (setup: MatchSetup) => Match` and has `GameCanvas.tsx` call
`attachViewport(host: HTMLElement): void`; its transition table creates the `Match` in
`match-loading` (`createMatch(setup)`, `match.start()`) and destroys it on leaving `match`. At the
same time, `apps/client/AGENTS.md` said that `game/GameCanvas.tsx` owns the `Match` lifetime, and
the code built the match in a React hook (`game/useMatch.ts`). The sprint-1 audit (AS-7, AC-25)
and question 46 of the multiplayer plan asked which one is right.

The owner answered with DEC-50 ([decisions log](../reference/game-design/13-owner-decisions-log.md),
2026-10-17): `SessionController` owns the `Match` lifetime; the match world is prepared in
`match-loading`; the `Match` is created when the match screen attaches its viewport and destroyed
on leaving `match`, so no map, simulation or game loop exists during character select; and
`GameCanvas` owns only the canvas elements, which it hands to `SessionController`.

That moves the creation of the `Match` out of `match-loading`, which changes 13 §2's table and
sketch. The decisions log ranks itself below the ADRs ("ADRs > this log > the reference docs"),
and the architecture review checklist asks for an ADR when a decision changes
([checklists §3](../agents/checklists.md#3-architecture-review-checklist-designs-new-folders-new-families)).
The `/pr-review` of the branch (2026-10-27, finding pr-docs-process-13) found no ADR for it.

## Decision

1. **`SessionController` owns the `Match` lifetime.** No React component creates or destroys a
   `Match`. `GameCanvas` owns the canvas elements and calls `attachViewport` when they mount; it
   calls the returned detach when they unmount.
2. **`match-loading` prepares, it does not build.** It loads the `match` asset group, then prepares
   the match world from the setup's seed (`prepareWorld`, a pure function of the seed). A load that
   fails, or a world that cannot be built, returns to `menu` with the `match-failed` reason.
3. **The `Match` is built on attach, in `match`.** `attachViewport(viewport)` builds the match
   through the injected factory `createMatch(request, viewport)`, which only `main.tsx` binds;
   `Match` stays the composition root of a match. It returns the match's detach. Outside `match`,
   `attachViewport` does nothing. Leaving `match` destroys the match (0 listeners, 0 frames) and
   drops the prepared world.
4. **One viewport, one match.** A second attach replaces the first match. Each attach builds a
   fresh `Simulation` from the setup's seed, so a re-attach (a React StrictMode remount, a replaced
   viewport) restarts the match from tick 0 on the same prepared world. A stale detach never ends
   a newer match.

### Documents amended on acceptance

Architecture 13 §2's sketch and table and a DEC-50 paragraph after the table: `INBOX.md` HC-T1
rows T-07, T-08, T-14 to T-16 and T-86, applied together (they also carry the owner's open items
HC-B1's DV-01, HC-F9 and HC-Q8); `apps/client/AGENTS.md`'s `GameCanvas` row: HC-T1 row T-01. 13
§10's Implementation status note then keeps only what is still interim. This ADR applies none of
them; its acceptance is the basis for the rows.

## Consequences

- Before `match` no canvas, map, simulation or game loop exists. The live check of 2026-10-24
  found exactly that (architecture 13 §10).
- A `Match` never exists without its canvas, so the renderer, the camera and the input devices are
  built once, with the match. The lifecycle is tested headlessly with a fake viewport
  (`SessionController.lifecycle.test.ts`, `FakeViewportCanvas`).
- The world must stay a pure function of the seed, because a re-attach rebuilds the match on it
  and must reproduce the same match. A re-attach restarts the match from tick 0, so anything that
  remounts the match screen's viewport during play loses the match's progress: the viewport stays
  mounted for the whole match.
- Branches written against `game/useMatch.ts` (removed here) build the simulation there. Their
  merge must move that wiring into the factory (`createBrowserMatch`), as the PR register's
  "Integration recipe" describes (`INBOX.md` HC-Q21).

## Alternatives considered

- **The base design: build the `Match` in `match-loading`** (13 §2 as written before DEC-50),
  then attach the viewport later. The match would exist, and could run, before the screen that
  draws it, and it would need its renderer, camera and devices without a canvas, or a second
  construction step once the canvas arrives. DEC-50 chose the attach instead.
- **`GameCanvas` owns the `Match`** (the earlier `apps/client/AGENTS.md` row and `useMatch.ts`).
  The lifetime of the simulation would follow React's mount order, StrictMode's double mount
  included, and the session could not end or replace a match it does not own. DEC-50 rewords that
  row.
