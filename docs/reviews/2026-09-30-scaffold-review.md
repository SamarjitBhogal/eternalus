---
title: Scaffold review (2026-09-30)
description: A critical assessment of the repository scaffold as it stood at commit ab6dd74 plus the feat/map branch - what is strong, what is missing against the requirements, what Phase 0 changed and what is deliberately left for Phase 1; read this to understand why the repo looks the way it does now.
audience: [humans, agents]
status: active
owner: sholtzman
last-reviewed: 2026-09-30
tags: [review, scaffold, architecture, tooling]
related:
  [
    'docs/changelog/2026-09-30-phase-0-foundation.md',
    'docs/architecture/README.md',
    'docs/reference/suggestions/discrepancies.md',
  ]
---

# Scaffold review (2026-09-30)

**Purpose.** Read this to see how the scaffold measured against the requirements document
before Phase 0, and why the Phase 0 PR changes what it changes. The scaffold (two commits by
SamarjitBhogal, 2026-09-26) was reviewed file by file, together with Aryan Walanj's `feat/map`
branch (2026-09-28). The verdict up front: the tooling and guardrails are well above the level
of a typical student project, the layering idea is right, and the gaps are almost all in the
_documentation and design_ layer the requirements ask for, not in the tooling.

## 1. What is strong (keep, and build on)

| Area                      | Assessment                                                                                                                                                                                                                                                                                                                                                                   |
| ------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Guardrails                | Strict TypeScript (`noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `verbatimModuleSyntax`), ESLint `strictTypeChecked` + `stylisticTypeChecked`, zero warnings, `no-console`, vitest plugin (no `.only`/`.skip`, every test asserts), knip for dead code, Prettier with LF, exact versions, `engine-strict`. This is the enforcement floor most teams never reach. |
| Core purity               | `packages/core/tsconfig.json` has `lib: ES2023`, `types: []` — browser and Node globals do not even typecheck in the simulation. `no-restricted-imports` bans React/Redux; `no-restricted-properties` bans `Math.random`. Determinism is enforced, not hoped for.                                                                                                            |
| Monorepo shape            | npm workspaces + `tsc -b` project references, core consumed as TypeScript source through an `exports` map (deep imports impossible). ADR 0001 explains it. Simple and correct for a five-person team.                                                                                                                                                                        |
| Process                   | Git hooks via `core.hooksPath` (no extra package), CI on three OSes with one named step per tool, PR template, coverage ratchet, ADR template, `agent-workflow.md` with a genuinely good AI-PR review checklist, `AGENTS.md` with `CLAUDE.md = @AGENTS.md` (exactly what Anthropic's docs recommend).                                                                        |
| Design intent             | `architecture.md` already had the right skeleton: fixed 30 TPS loop with interpolation, Commands as the only mutation path, typed `GameEvents`, throttled snapshots to React, content-by-ID, "systems never call each other". Those ideas are preserved verbatim in the new docs.                                                                                            |
| Companion-file convention | `X.ts` / `X.types.ts` / `X.constants.ts` / `X.test.ts` with "only that class in the file" is a concrete, lintable expression of SRP.                                                                                                                                                                                                                                         |

## 2. Gaps against the requirements document

| #   | Gap                                                                                                                                                                                                     | Severity | Phase 0 action                                                                                                                                |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| G1  | No plan, no requirements catalogue, no split reference, no research folder — the deliverables the requirements doc asks for did not exist.                                                              | high     | Written: `docs/plan`, `docs/requirements`, `docs/reference`, `docs/research`.                                                                 |
| G2  | Architecture was one 130-line file with no entity model, map/minimap, structures, physics, AI, story, persistence, diagnostics or harness design.                                                       | high     | Written: 17 themed architecture docs + extension recipes.                                                                                     |
| G3  | The "database configuration (single access with a controller in front)" had no counterpart; the scaffold said "no server" and stopped there.                                                            | high     | ADR 0005 + `14-persistence-and-resources.md` (IndexedDB behind `PersistenceController`, `ResourceController` for assets).                     |
| G4  | Nothing about the config-driven world (`numLanes`, towers per lane) or the minimap-by-construction requirement; `feat/map` went the other way (hand-traced coordinates).                                | high     | ADR 0009 + `06-map-and-minimap.md` + review notes for `feat/map`.                                                                             |
| G5  | Runtime monitoring ("if an entity passes through a wall, log it") absent.                                                                                                                               | high     | `15-diagnostics-and-runtime-testing.md`: invariants, logger port, replay-hash tests, soak tests.                                              |
| G6  | Agent harness was instruction files only: no permissions, no hooks, no skills, no subagents, no cross-tool set (Gemini/Codex/Copilot), no task brief template, no progress log, no product-owner queue. | medium   | `.claude/` settings + hooks + skills + agents, `.agents/`, `GEMINI.md`, `.gemini/`, copilot file, issue templates, `INBOX.md`, `PROGRESS.md`. |
| G7  | Docs had no frontmatter, no index, no link/format check — agents had no way to find "their" document and links could rot silently.                                                                      | medium   | ADR 0008, frontmatter on every doc, `scripts/docs/check-docs.mjs` in `npm run check` and CI.                                                  |
| G8  | Git model did not cover "no commits to main until a phase is done" or a waiting-PR workflow.                                                                                                            | medium   | ADR 0007 + `docs/process/git-workflow.md` (phase branches, stacked PRs, `rebase --onto`).                                                     |
| G9  | Contradictions between the requirements doc, the game doc and the scaffold were unrecorded (language, UI libraries, persistence, inheritance vs composition, team as class).                            | medium   | Decided with the product owner (ADRs 0003–0006); 63 discrepancies catalogued in `suggestions/discrepancies.md`.                               |
| G10 | Client-side layer rules (`ui/` never imports `game/`; views only `import type` from core; only the renderer touches the 2D context) are "review only".                                                  | low      | Left for Phase 1 (needs code to lint): ESLint `no-restricted-imports` per folder — see `16-agentic-harness.md` known gaps.                    |
| G11 | No import-cycle detection inside a package; no coverage auto-ratchet.                                                                                                                                   | low      | Phase 1: zero-dep cycle script or dependency-cruiser via ADR; `thresholds.autoUpdate` locally.                                                |
| G12 | Placeholder tests exist only to make coverage run; thresholds (core 80 %, client 45–50 %) are fine as a floor but the client number is low.                                                             | low      | Phase plan raises thresholds per phase (P1 core 85 %, client 55 %; P5/P6 higher).                                                             |

## 3. Design critiques and the choices made

1. **Composition-first vs the required inheritance tree.** `CONTRIBUTING.md` §3 ("prefer
   composition, at most 3 levels") and the requirements doc's explicit class tree looked like a
   conflict. They are not: taxonomy by shallow inheritance, behaviour by components and
   strategies, per-tick logic in systems (ADR 0006). The scaffold's rule survives unchanged.
2. **"Neutral entity" as a base class** would have baked team into the type. Revives and
   ascension change team at runtime, so team is a component (`Team`). Flagged for the product
   owner (DEC-03) because it deviates from the letter of the requirements doc.
3. **Redux for a single-player game** is heavier than needed, but it is already typed, wired
   and known; the cost of keeping it is near zero and the bridge design isolates it. Kept
   (ADR 0004), with the note that a vanilla-DOM UI could replace it behind the same bridge.
4. **`sequence: { shuffle: true }` in Vitest** is a good idea (catches hidden coupling) and is
   kept; the seed is fixed so failures reproduce.
5. **Hooks run `check:quick` on the whole project** on every commit. Fine today; when core has
   thousands of lines this becomes slow and people will be tempted to bypass it. The planned
   upgrade to the full `check` on pre-push should be reconsidered against a per-file lint hook
   (which the Claude Code `PostToolUse` hook now provides for agents).
6. **`AGENTS.md` size.** It grew from 114 to ~150 lines in Phase 0 because it now doubles as a
   table of contents; the OpenAI harness guidance caps it at "about 100 lines". The
   `doc-gardening` skill has a standing rule to keep moving detail out.
7. **`.idea/` files are present locally but ignored** — correct. `.vscode/extensions.json`
   recommends only Prettier; adding the ESLint extension would surface lint in editors
   (`dbaeumer.vscode-eslint`) — trivial, left to the team.
8. **CI runs the full matrix on every PR** (three OSes × full check). Right for correctness;
   if minutes become scarce, run macOS/Windows on the phase branches only.

## 4. Review notes for `feat/map` (Aryan, 2026-09-28)

Constructive summary (full detail in `docs/architecture/06-map-and-minimap.md` §"review
notes" and DISC-14/15):

- **Keep:** `MapDefinition`, `MapFeature`, `MapTerrain`, `MapLane`, `Vec2`/`Rect`/`Polygon`, the
  mirror-symmetry and unique-id tests, the 1600 × 900 world with Light west / Dark east, and the
  `TUNE` markers — good data modelling and good test instincts.
- **Change before merge:** `MAP_1` hardcodes six generic `team-structure` positions per team and
  every lane vertex. The requirements demand that `numLanes`, `spawnTowersPerLane` and
  `buffTowersPerLane` regenerate the map; so `MAP_1` becomes a _preset_ (rift/bounds polygons,
  lane curvature) consumed by `MapGenerator`, structure positions are computed, and
  `MapFeatureKind` gets specific kinds (`spawner-tower`, `buff-tower`, `stronghold`, `gate`,
  `turret`, `camp`, `capture-point`, `cathedral`, `corner-camp`, `obstacle`).
- **Small things:** `TeamId` belongs in a shared teams module, not in map types;
  `packages/core/src/index.ts` has a duplicated header comment; the `Polygon` type would be
  better as `ConvexPolygon` where convexity is assumed by SAT (physics doc).
- **Process:** the branch was pushed directly; under the new model it should be a PR into
  `phase/1-simulation-kernel-and-world` with the task brief "map types + generator preset".

## 5. What Phase 0 deliberately did not do

- No game code, no dependencies, no changes to the ESLint/TypeScript strictness (only an added
  block for `scripts/**/*.mjs` globals and the docs check in `npm run check`).
- No client-side boundary lint rules yet (nothing to lint); Phase 1 sprint 1.1.
- No `.codex/hooks.json` or `.cursor/rules` (AGENTS.md is read natively; adding them would
  duplicate rules).
- No CODEOWNERS (GitHub handles for all five members are not known); recommended once known.

## Related

- [`../changelog/2026-09-30-phase-0-foundation.md`](../changelog/2026-09-30-phase-0-foundation.md)
- [`../architecture/README.md`](../architecture/README.md)
- [`../reference/suggestions/discrepancies.md`](../reference/suggestions/discrepancies.md)
- [`../plan/phase-0-documentation-and-harness.md`](../plan/phase-0-documentation-and-harness.md)
