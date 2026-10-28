---
title: 0020. Client test configuration
description: Proposed record of three additive changes to the client's guardrail configs made on feat/hud-and-character-select without an ADR - Vitest processes `.css?raw` imports so tests can read stylesheet text, Vitest runs vite.config.test.ts, and tsconfig.node.json type-checks it - with why none weakens a check and why reading stylesheets through node:fs or dropping the build-config test would be worse; read this before changing apps/client/vitest.config.ts, apps/client/tsconfig.node.json or a test that reads CSS text.
audience: [humans, agents]
status: draft
owner: sholtzman
last-reviewed: 2026-10-27
tags: [adr, guardrail, testing, vitest, tsconfig, css, build]
related:
  - 'docs/process/guardrails.md'
  - 'docs/agents/checklists.md'
  - 'docs/architecture/14-persistence-and-resources.md'
  - 'docs/changelog/pr-feat-hud-and-character-select.md'
  - 'apps/client/vitest.config.ts'
  - 'apps/client/tsconfig.node.json'
---

# 0020. Client test configuration

- Status: proposed (drafted 2026-10-27; the three changes are already on
  `feat/hud-and-character-select`, so accepting this ADR approves them, and refusing it means
  reverting them together with the tests that need them; the product owner decides)
- Date: 2026-10-27

## Context

`apps/client/vitest.config.ts` and the `tsconfig*.json` files are guardrail configs: guardrails.md
lists them in its `paths`, and its [§4](../process/guardrails.md#4-changing-a-guardrail) says a
guardrail changes only through an ADR in the same pull request as the change ("Agents never do this
on their own"). The AI-PR checklist ([checklists §2](../agents/checklists.md)) accepts changed
guardrail configs only "through an ADR linked in the PR", and architecture 02 §10 maps "a rule
change to tooling" to an ADR. The branch changed three lines without one; the `/pr-review` of
2026-10-27 found it (pr-game-data-01, with duplicates in four other areas):

1. **`apps/client/vitest.config.ts`, `css: { include: [/\.css\?raw$/] }`** (commit `4a6dec6`,
   2026-10-18). The comment written with it says why: Vitest blanks every CSS import it does not
   process, `?raw` included, so a test that imports a stylesheet's text would get none. At
   `a171761`, 37 client test files import a stylesheet with `?raw`, and no production file does.
   Among them, `styles/tokenContrast.test.ts` reads the colour tokens of `global.css` and checks
   the contrast pairs (architecture 13 §7); `ui/motionTokens.test.ts` scans every module so that
   motion is timed only with the motion tokens and the game font keeps its size floor; the
   component tests check that their module uses tokens only, no colour literal, and boxes equal to
   the shared constants, and they pin the Figma geometry the visual audit verified.
2. **`apps/client/vitest.config.ts`, `test.include` gains `'vite.config.test.ts'`** (commit
   `dc5bdfa`, 2026-10-26). That test pins `build.assetsInlineLimit: 0` in `vite.config.ts`, so the
   build inlines no image into the JavaScript and each asset loads with its own group (architecture
   [14 §11](../architecture/14-persistence-and-resources.md); the pre-PR critic's run 2, build-01:
   62 small images, about 111 kB, had been inlined into the boot bundle).
3. **`apps/client/tsconfig.node.json`, `include` gains `vite.config.test.ts`** (commit `dc5bdfa`),
   so the typecheck covers that test as it covers the two config files beside it.

## Decision

Keep the three lines, recorded here:

- The client's Vitest run processes stylesheet imports that end in `?raw` and only those, so tests
  can read a stylesheet's text. Plain CSS-module imports in tests stay unprocessed.
- `vite.config.test.ts` sits next to `vite.config.ts`, outside `src/` (tests sit next to the file
  they test, `AGENTS.md` "Testing"), so the client's Vitest include and `tsconfig.node.json` name
  it.

No check is weakened: the coverage thresholds (55 for each measure), the coverage `include` and
`exclude`, the shuffle seed and `restoreMocks` are unchanged, every `src/**` test is still
collected, and no ESLint rule, hook or CI step changed.

The guardrail table ([guardrails §1](../process/guardrails.md#1-guardrail-table)) needs no new row:
the rows that name these files (strict TypeScript with the per-package `tsconfig*.json`; the
coverage ratchet with `apps/client/vitest.config.ts`) enforce the same rules after the change.

## Consequences

- Production is unaffected: the option is in the test configuration only, and no non-test file
  imports `?raw` CSS.
- A test that pins a declaration's exact text fails on a harmless rewrite of that rule (`/pr-review`
  pr-ui-hud-components-assets-06). Those pins are kept because they guard the geometry the owner's
  visual audit accepted (the critic's first run, N8, and build ruling OD-33, in the PR register and
  [reference 15](../reference/game-design/15-figma-frames-and-creative-decisions.md)); new tests
  prefer invariants (tokens only, no colour literal, boxes equal to the shared constants).
- Removing `assetsInlineLimit: 0` now fails a test instead of silently growing the boot bundle.
- A future stylesheet test needs no further config change.

## Alternatives considered

- **Read stylesheets with `node:fs` in each test.** The client's test project
  (`apps/client/tsconfig.test.json`) types only `vite/client` and compiles all of `src/`, so Node's
  `fs` and `path` would need `types: ['node']` there: a broader tsconfig change, which makes Node
  globals visible to every source file that project type-checks. Each of the 37 tests would also
  resolve its stylesheet path by hand instead of through the bundler's import.
- **Drop the build-config test** and keep `assetsInlineLimit: 0` unpinned. Nothing would fail if
  the line went away: the build would inline small images into the boot bundle again, against 14
  §11's per-group loading, and only a manual look at the bundle size would notice. Every behaviour
  change comes with a test (`AGENTS.md` "Testing").
- **Move the build-config test into `src/`.** It would bring `vite.config.ts`, a file the Node
  project (`tsconfig.node.json`) types, into the app's test project, which is typed for the browser,
  and the test would no longer sit next to its file.
