---
title: Engineering standards
description: Senior-engineering requirements ES-01 to ES-13 for Eternalus (SDLC, the testing pyramid, coverage ratchet, determinism, performance budgets, reliability, repeatability, security, caching, DBMS-style persistence, accessibility, documentation, code review); read when you plan tests, performance, security, persistence or a release.
audience: [humans, agents]
status: draft
owner: sholtzman
last-reviewed: 2026-10-29
tags: [requirements, engineering, testing, performance, security, persistence]
paths: ['packages/**', 'apps/**', '.github/**', '.githooks/**']
related:
  [
    'docs/requirements/01-architecture-principles.md',
    'docs/process/sdlc.md',
    'docs/architecture/15-diagnostics-and-runtime-testing.md',
  ]
---

# Engineering standards

Purpose: Read this when you plan the tests for a feature, set or measure a performance budget,
touch persistence or security, or prepare a phase for merge. These standards turn "SENIOR
ENGINEER LEVEL CODING. NO SHORTCUTS" into checkable requirements with IDs (`ES-nn`). The
Definition of Done, the guardrail table and the test conventions are owned by
[`CONTRIBUTING.md`](../../CONTRIBUTING.md) and [`../process/guardrails.md`](../process/guardrails.md);
this document states what the engineering must achieve and how it is measured.

## Lifecycle

### ES-01 SDLC: phases, sprints, tasks, reviews, decisions, retrospectives

- **Requirement.** Work is organised as phases (one plan doc each, on a `phase/<n>-<name>`
  branch, decided D5) → sprints (sections of the phase doc with a goal, a checklist, tests and a
  success metric) → tasks (briefs or issues that cite requirement IDs). Every task ends with the
  Definition of Done ([`CONTRIBUTING.md` §8](../../CONTRIBUTING.md)) and one approving review;
  every decision that changes a requirement, boundary, guardrail or dependency is an ADR; every
  phase ends with a retrospective recorded in its changelog entry and a metrics update in
  [`../plan/README.md`](../plan/README.md). Sprint length is provisional until the term timeline
  is confirmed ([`README.md`](README.md)). Full process:
  [`../process/sdlc.md`](../process/sdlc.md).

## Testing

### ES-02 The testing pyramid for this project

- **Requirement.** Every level below exists once the code it tests exists; a feature is complete
  only when it is covered at every level that applies. Tests are deterministic (seeded, tick-driven,
  no real timers) and sit next to the code (OG-03). Tooling is Vitest in both packages.

| Level                  | What it covers                                                                                                           | How                                                                                                                | Gate                     |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------ | ------------------------ |
| Unit                   | Components, utils (Vec2, `SeededRandom`, hash), strategies, validators, reducers, selectors                              | Plain Vitest tests beside the file                                                                                 | `npm run test`, coverage |
| System                 | One system against a minimal `GameState`, stepping ticks and asserting state and emitted events                          | Construct the system with fakes (AP-10); step N ticks                                                              | `npm run test`           |
| Simulation             | Full `Simulation` with bots only for N ticks: timeline, spawns, victory, invariants                                      | Headless in Node; assert outcomes and that no `DiagnosticEvent` fired                                              | `npm run test`           |
| Replay-hash regression | Recorded seed + command log + expected checkpoint hashes                                                                 | Fixtures under `__fixtures__/`; replay and compare `StateHasher` output (ES-04)                                    | `npm run test`           |
| Contract               | Every adapter of a port passes the same suite (`StorageAdapter`, `FrameScheduler`, `Renderer`)                           | One shared suite parameterised over adapters; browser-only adapters run in a dev harness (Recommendation)          | `npm run test` for fakes |
| Client                 | React screens and HUD via `react-dom/server`; hooks; `GameLoop` with a fake scheduler; views with a recording `Renderer` | Node, no DOM ([`apps/client/AGENTS.md`](../../apps/client/AGENTS.md))                                              | `npm run test`, coverage |
| Soak                   | Tens of thousands of ticks at the unit cap, heavy invariants every N ticks, bounded counters                             | Tagged test with an explicit timeout, run by `npm run test:soak` (Recommendation) nightly and before a phase merge | Phase merge              |
| Performance            | Tick time at cap; flow-field rebuild cost                                                                                | Headless timing test with a generous threshold; the real budget is measured in the browser (ES-05)                 | Phase merge              |
| Runtime invariants     | Light invariants every tick, heavy every N, in dev builds and tests                                                      | `InvariantRunner` (AP-12)                                                                                          | Always on in dev         |
| Manual playtest        | Feel, balance, UI flow                                                                                                   | Checklist in each sprint of the phase doc                                                                          | Sprint review            |

Evidence for replay, golden-hash and soak techniques:
[`../research/persistence-input-diagnostics-research.md#c3-testing-a-running-game-properties-replays-golden-hashes-soak-tests`](../research/persistence-input-diagnostics-research.md#c3-testing-a-running-game-properties-replays-golden-hashes-soak-tests).

### ES-03 Coverage ratchet

- **Requirement.** Coverage thresholds live in each package's `vitest.config.ts` and only go up
  (today core 80%, client 45–50%; the mechanism is in
  [`../process/guardrails.md`](../process/guardrails.md)). When a PR raises coverage well above a
  threshold, it raises the threshold in the same PR. Recommendation: enable Vitest
  `thresholds.autoUpdate` for local runs only and add a per-file minimum once real code exists so
  one large untested file cannot hide behind the global number. Coverage is a floor, not a goal:
  tests must assert behaviour (AI-05).

### ES-04 Determinism: requirement and test recipe

- **Requirement.** For any seed and command log, two runs of `Simulation` produce identical
  `StateHasher` output at every checkpoint tick (AP-03). Tests: (1) **run-twice**: build two
  simulations from the same seed, feed the same commands, compare hashes every N ticks for M
  ticks; (2) **replay fixtures**: recorded matches replayed against stored hashes (a mismatch is
  a bug or a documented balance change that regenerates the fixture); (3) **order independence**:
  the test runner shuffles test order with a fixed seed; (4) **no wall clock**: the guardrails
  ban `Math.random` and timers in core. Hashing serialises state canonically (sorted keys, tick,
  RNG state, per-entity id/position/health) with FNV-1a 32-bit.
- **Sketch.**

```ts
// Simulation.determinism.test.ts (sketch)
it('same seed and commands produce the same state hash', () => {
  const run = () => {
    const sim = new Simulation({ config, content, rng: new SeededRandom(42), logger });
    for (const { tick, command } of fixture.commands) sim.enqueueCommand(command, tick);
    const hashes: number[] = [];
    for (let t = 0; t < fixture.ticks; t++) {
      sim.step();
      if (t % 30 === 0) hashes.push(sim.hash());
    }
    return hashes;
  };
  expect(run()).toEqual(run());
});
```

## Performance

### ES-05 Performance budgets and how they are measured

- **Requirement.** The budgets below are requirements (AP-13). Values marked `Recommendation:` are
  the writer's proposal pending the product owner's acceptance; the reference machine is a
  mid-range laptop of the team's choosing, recorded in the plan.

| Metric                  | Budget                                                                                                                        | Measured by                                                                                                                        |
| ----------------------- | ----------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| Simulation tick         | 30 ticks/s (decided, D9); tick cost ≤ 8 ms p95 at 2 × 144 units + structures (Recommendation: leaves 4× headroom under 33 ms) | `performance.mark('tick-start'/'tick-end')` + `measure` in `GameLoop`; headless timing test with `process.hrtime` in the test file |
| Render                  | 60 fps target; render ≤ 8 ms p95 (Recommendation)                                                                             | `render-start`/`render-end` measures; frame-time histogram in the perf overlay                                                     |
| Long animation frames   | No frame > 50 ms during a match after loading                                                                                 | `PerformanceObserver` on `long-animation-frame` with script attribution                                                            |
| Allocation in hot paths | Zero per-tick allocation in Movement, Pathing, Collision, Combat, Snapshot at steady state                                    | DevTools allocation sampling during a soak; pools and typed arrays reviewed                                                        |
| Flow-field rebuild      | Time-sliced with a per-tick cell budget; a full rebuild never exceeds one tick budget                                         | Timing test on the largest config                                                                                                  |
| Memory                  | Bounded over a 30-minute soak (entity count, listeners, ring buffers, pools stay within caps)                                 | Soak test counters; `measureUserAgentSpecificMemory` when available                                                                |
| Startup                 | Menu interactive ≤ 3 s on the reference machine (Recommendation); byte-based loading progress                                 | `ResourceController` progress events; Vite build size report                                                                       |

- **Rule.** Profile before optimising; budgets are checked at each phase merge and regressions
  block the merge. Techniques (pools, typed arrays, staggered AI, layered canvases) are in
  [`../research/game-architecture-and-performance-research.md#5-canvas-2d-performance`](../research/game-architecture-and-performance-research.md#5-canvas-2d-performance)
  and [`#6`](../research/game-architecture-and-performance-research.md#6-object-pooling-and-gc-avoidance).

## Reliability and repeatability

### ES-06 Reliability

- **Requirement.** Invariants run in every dev build and every test (AP-12). React error
  boundaries wrap every screen and the match view; a crash inside the match shows a recoverable
  results/error screen and dumps the replay. Persistence failures never crash the game: quota
  errors evict replays first, then warn; an unopenable database falls back to
  `MemoryStorageAdapter` with a visible "progress will not be saved" notice. The game loop clamps
  the accumulator so a background tab resumes cleanly; held input is cleared on `blur` and
  `visibilitychange`. Unhandled promise rejections are a lint error (`CONTRIBUTING.md` §1).

### ES-07 Repeatability

- **Requirement.** Every match is reproducible from `{ seed, contentVersion, coreVersion,
commands }` (ES-04); every build is reproducible from the committed lockfile (`npm ci` fails on
  drift), exact versions (`save-exact`), the pinned Node version (`.nvmrc`, `engine-strict`) and
  LF line endings; CI runs the identical `npm run check` on Linux and Windows (macOS: local full check, ADR 0019); tests need no
  network and no real time. A bug report is a seed plus a command log, not a description.

## Security

### ES-08 Security for a browser-only game

- **Requirement.** No server means no remote attack surface, but the browser is the trust
  boundary. The threat model and controls:

| Asset                    | Threat                                                     | Control                                                                                                                                                                                    |
| ------------------------ | ---------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Player profile and saves | Corrupt or hand-edited IndexedDB records, malicious import | Validate every DTO on read and import against its `schemaVersion`; reject and quarantine, never trust                                                                                      |
| The page                 | Script injection through content or names                  | CSP in `index.html` without `unsafe-eval` (dev-only relaxations for Vite HMR); no `eval`, `new Function`, `innerHTML`, `dangerouslySetInnerHTML` with user data; React escaping by default |
| Dependencies             | Vulnerable or malicious packages                           | `npm audit` at `audit-level=high` (`.npmrc`); no new dependency without approval; exact versions; Recommendation: Dependabot/Renovate PRs                                                  |
| Repository               | Secrets, force pushes, unreviewed merges                   | No secrets in the repo (`.env*` ignored, none needed); branch protection on `main` ([`../process/guardrails.md` §5](../process/guardrails.md)); one approval, green CI                     |
| Assets                   | Unlicensed material                                        | Licensed or team-made only; licence recorded in the manifest (AP-14)                                                                                                                       |

## Caching

### ES-09 Caching strategy

- **Requirement.** Caches are explicit, owned by one class, and have a stated invalidation rule.

| What                             | Strategy                                                                                                                         | Invalidated when                                                              |
| -------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| Content definitions              | Flyweight: loaded and validated once, frozen, referenced by entities                                                             | Content hot-reload in dev (definitions swapped)                               |
| Flow fields (per lane, per team) | Cached in pre-allocated typed arrays; rebuilt time-sliced                                                                        | A cost-grid cell changes (structure or obstacle destroyed, gate opens/closes) |
| Spatial hash                     | Rebuilt every tick into pre-allocated arrays (cheaper than maintaining); static index for structures kept separately             | Every tick (dynamic); terrain change (static)                                 |
| Legend paths (A*)                | Cached per controller until goal or grid changes                                                                                 | Goal change or dirty grid                                                     |
| Pre-rendered terrain chunks      | Offscreen canvases per chunk, dirty flag per chunk; minimap terrain downscaled from them                                         | Destructible tile in the chunk changes                                        |
| Sprite atlases                   | Pre-scaled to device pixel ratio at load so `drawImage` never scales                                                             | DPR change                                                                    |
| Assets                           | `AssetCache` in `ResourceController` keyed by manifest id; HTTP caching via hashed file names; Cache API/service worker deferred | Manifest version change                                                       |
| Snapshots                        | Double-buffered previous/current; views read, never copy                                                                         | Every tick (rotation, no allocation)                                          |
| React derived data               | Memoised selectors (`createSelector`) in `bridge/selectors/`                                                                     | Store slice change                                                            |

## Persistence

### ES-10 DBMS-style rules for persistence

- **Requirement.** Persistence behaves like a small database behind one door (AP-08, decided D3):
  one `DB_VERSION` integer and an ordered migration ladder run inside the `versionchange`
  transaction; one `readwrite` transaction per use case (Unit of Work: saving a match result
  writes history, profile stats and replay atomically); versioned DTOs (`schemaVersion`) mapped to
  and from core types at the repository boundary, never class instances; validation on every read;
  `durability: 'strict'` for match results and `'relaxed'` for autosaves; `navigator.storage.persist()`
  requested at first launch with a one-line warning about browser eviction; export/import of the
  profile as JSON (Recommendation); an in-memory adapter for tests and as the degraded mode. Design
  and evidence:
  [`../research/persistence-input-diagnostics-research.md#a3-patterns-repository-unit-of-work-facade-dtos-migrations-replays`](../research/persistence-input-diagnostics-research.md#a3-patterns-repository-unit-of-work-facade-dtos-migrations-replays).

## Accessibility

### ES-11 Accessibility minimums

- **Requirement.** Every control is rebindable in-game with presets (FR-078); HUD text has a
  minimum size and contrast (Recommendation: 4.5:1 for text, 3:1 for bars, following WCAG AA);
  colour is never the only signal (team identity uses shape or outline as well as palette; shield
  bars are labelled or patterned, not only coloured); the match can be paused from the menu key;
  a reduced-motion setting disables screen shake and large flashes (Recommendation); no element
  flashes faster than 3 Hz. Rebinding is "one of the best value accessibility features"
  ([`../research/persistence-input-diagnostics-research.md#b2-rebinding-ux-and-data-representation`](../research/persistence-input-diagnostics-research.md#b2-rebinding-ux-and-data-representation)).

## Documentation and review

### ES-12 Documentation standards

- **Requirement.** TSDoc on every exported class and public method (CP-14); docs under `docs/`
  follow the frontmatter and hygiene rules (OG-07, OG-08) and are updated in the same PR as the
  change (OG-06); every phase has a changelog entry; every decision an ADR; every doc a purpose
  paragraph and related links. Documentation is part of the Definition of Done, not a follow-up.

### ES-13 Code review standards

- **Requirement.** Every PR gets one approving review from someone who did not write it (for
  agent PRs, a human: AI-07). Reviewers use [`../agents/checklists.md`](../agents/checklists.md)
  and answer three questions in the review: which requirement IDs this delivers, which principle
  each new abstraction serves and what its single place of change is (CP-08, AP-09), and what
  else would have to change for the next feature of the same kind. Recommendation: keep PRs under
  ~400 changed lines excluding tests and fixtures; larger work is a stack of PRs.

## Related

- [`01-architecture-principles.md`](01-architecture-principles.md): AP-03, AP-12, AP-13, AP-14 that these standards verify
- [`../process/sdlc.md`](../process/sdlc.md), [`../process/git-workflow.md`](../process/git-workflow.md), [`../process/guardrails.md`](../process/guardrails.md)
- [`../architecture/15-diagnostics-and-runtime-testing.md`](../architecture/15-diagnostics-and-runtime-testing.md): invariants, logging, replays, perf overlay
- [`../architecture/14-persistence-and-resources.md`](../architecture/14-persistence-and-resources.md): the persistence design ES-10 constrains
- [`../research/persistence-input-diagnostics-research.md`](../research/persistence-input-diagnostics-research.md) and [`../research/game-architecture-and-performance-research.md`](../research/game-architecture-and-performance-research.md): evidence
- [`../../CONTRIBUTING.md`](../../CONTRIBUTING.md): Definition of Done and test conventions
