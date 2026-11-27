---
title: 'Progress 2026-11-25: feat/minion-strength-flow-field (HC-B45 clean-up, DEC-384)'
description: 'Phase 3 / minion plan gap (strength by flow-field distance), sholtzman + Claude Code: the owner signed off the LaneProgressOf port and the critic clean-up (DEC-384); the polyline is a second port, DefaultSystemPipeline composes them, the port is required.'
audience: [humans, agents]
status: active
owner: sholtzman
last-reviewed: 2026-11-25
tags: [plan, progress, log]
---

# Progress 2026-11-25: feat/minion-strength-flow-field (HC-B45 clean-up, DEC-384)

Phase 3 / minion plan gap: minion strength by flow-field distance · feat/minion-strength-flow-field · sholtzman + Claude Code

- What was done: the owner answered HC-B45 on the Owner Calls page (v98): "B: accept it, and
  also build the critic's clean-up in this PR" (DEC-384; it also signs off the `LaneProgressOf`
  port). `LaneRoutes.progress` is the polyline as a second `LaneProgressOf`.
  `MinionStrengthStep` has no polyline of its own (`null` → strength 1).
  `DefaultSystemPipeline.laneProgressOf` composes "field, else polyline, else `null`". The port
  is required in the step and in `createDefaultDamageSteps`, and `DamagePipeline` has no default
  steps.
- Also changed: 41 `new DamagePipeline()` calls in 16 core test files, and the `setUp` default
  of `KillCredit.test.ts`, now take `damageStepsWithoutLaneProgress()`
  (`combat/__fixtures__/damageSteps.ts`, strength 1).
  `DefaultSystemPipeline.strength.test.ts` tests the composer with fake sources; the `vi.mock`
  is gone. Docs: architecture 05 §9, 06 §6, 18 status note; decisions log DEC-384; `INBOX.md`
  ticks both items. Open PRs that call `new DamagePipeline()` get a type error at their next
  phase/3 merge after this PR lands; the fix is one argument.
- Tests fail first (`../eternalus-agent-work/pr-rule-2026-11-25/hc-b45-red-first.log`,
  `hc-b45-breaks.log`): the 4 new tests were red before the code. Break 1, the pipeline injects
  `laneProgressOf(null, null)`: `Simulation.modifiers.test.ts` "lets minions near home hit
  harder than base" fails. Break 2, the composer asks the polyline first: 2 composer tests fail.
  Break 3, the old step with its own polyline: the step test fails ("expected 150 to be close to
  100"). Each break was restored and `cmp` matched.
- Gate: the `architecture-reviewer` critic (round 1,
  `../eternalus-agent-work/pr-rule-2026-11-25/critic-hc-b45-r1.md`) found a match plays the
  same and the design right, with one blocker: no test checked any more that the match
  pipeline hands its lane fields to the composer. Fixed: a test builds the real pipeline and
  checks the composer gets the match's lane fields and polylines (break 4, the fields dropped:
  "expected null to be an instance of LaneFlowFields"). Nits fixed: the port's TSDoc names both
  implementations; a step test is renamed to what it proves; a test covers a lane of no length
  (break 5, the guard removed: "expected NaN to be +0"; `hc-b45-breaks-r2.log`).
  The critic round 2 (`critic-hc-b45-r2.md`): PASS WITH NITS; its two nits (this line, a test
  variable name) are fixed. `/ponytail-review`: "Lean already. Ship."
- Checks run: `npm run check` on the fixed tree → exit 0: core "Tests 1848 passed
  (1848)" (301 files), protocol "Tests 31 passed (31)", client "Tests 2186 passed (2186)" (320
  files), server "Tests 163 passed (163)", both builds, "Documentation check passed."
  (`../eternalus-agent-work/pr-rule-2026-11-25/pr82-check-4.log`); then `prettier --check` and
  `npm run docs:check` with this file.
- Next step: the push and a comment on PR #82.
