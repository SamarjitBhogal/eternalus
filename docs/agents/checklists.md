---
title: Checklists for agent work and review
description: The Definition of Done for agent tasks, the AI-PR review checklist, the architecture review checklist and the phase exit checklist; read this when finishing a task, reviewing a PR or closing a phase.
audience: [humans, agents]
status: active
owner: sholtzman
last-reviewed: 2026-10-29
tags: [agents, process, review, checklist]
related:
  [
    'docs/agents/running-agents.md',
    'docs/process/git-workflow.md',
    'docs/architecture/02-code-structure.md',
  ]
---

# Checklists for agent work and review

**Purpose.** Read this when you finish a task (Definition of Done), review a pull request
written with an agent (AI-PR review), check a design (architecture review) or close a phase
(phase exit). `CONTRIBUTING.md` §8 is the short human DoD; this file is the operational version.

## 1. Definition of Done (agent task)

- [ ] The task brief's acceptance criteria are met, and nothing outside its scope changed.
- [ ] `npm run check` passes locally; the result is reported verbatim (no "should pass").
- [ ] Tests exist next to the code, assert behaviour, are deterministic (seeded; tick-stepped).
- [ ] No guardrail weakened: no `any`, `@ts-ignore`, unjustified `eslint-disable`, skipped or
      deleted tests, loosened assertions, lowered thresholds, new dependencies.
- [ ] Tuning numbers and display names are in `packages/core/src/content/` (or `config/`).
- [ ] New kinds are added through the registries (`EntityRegistry`, `AbilityRegistry`,
      `ViewRegistry`, `SystemPipeline`), not through edits scattered across files.
- [ ] Docs updated where behaviour, layout or workflow changed; frontmatter `last-reviewed`
      bumped; `docs/plan/PROGRESS.md` entry appended; the sprint checkbox ticked.
- [ ] Commits (if the human asked for them) are Conventional Commits with an allowed scope, on
      a task branch off the phase branch. Nothing was pushed by the agent.
- [ ] Then the pre-PR gate (`AGENTS.md` "Before opening a PR", ADR 0010): critic against the
      base commit's design docs (violations reworked, better-than-design items signed off and
      folded into the docs), `/ponytail-review` + `/ponytail`, `npm run check` re-run and green.
      Only then is the PR opened.

## 2. AI-PR review checklist (reviewer: human or `pr-review` skill / `architecture-reviewer`)

- [ ] CI is green on Linux and Windows; `npm run check` reproduced locally.
- [ ] Every modified test was read: no removed or loosened assertions, no snapshots of wrong output.
- [ ] New tests test behaviour, not lines.
- [ ] No new `eslint-disable`, `@ts-expect-error`, `as` casts or `!` assertions without a convincing reason.
- [ ] No new dependencies, or each one approved and justified in one line.
- [ ] Guardrail configs untouched (`eslint.config.js`, tsconfigs, `vitest.config.ts`, hooks,
      CI, `.claude/settings.json`), or changed through an ADR linked in the PR.
- [ ] Scope: no drive-by renames, reformatting or "cleanups".
- [ ] Placement matches `docs/architecture/02-code-structure.md`; imports respect the layer rules.
- [ ] No invented library APIs (checked against `node_modules` types).
- [ ] No product or game-design decisions made by the agent; every number traces to a
      reference doc, requirement or `TUNE` marker.
- [ ] Determinism in core: no `Math.random`, `Date`, timers, `Map`/`Set` iteration whose order
      depends on timing, or comparator-less sorts.
- [ ] Docs, frontmatter and PROGRESS entry present; PR template complete.
- [ ] Verdict written as `approve` or `request-changes` with findings by severity.

## 3. Architecture review checklist (designs, new folders, new families)

- [ ] Layer and folder: the thing lives in exactly one layer, with a may-import list.
- [ ] SRP: one class per file, one reason to change; systems own loops, entities own data.
- [ ] OCP: adding the next variant needs a new file plus one registry line, not edits to a
      `switch` or to several files. The recipe in `17-extension-recipes.md` is followed or updated.
- [ ] LSP/ISP/DIP: subclasses are substitutable; interfaces are narrow; dependencies are injected
      through constructors against ports, never `new`-ed inside domain code.
- [ ] DRY: shared types/constants live in a shared file, not in one class's companion file.
- [ ] Inheritance depth ≤ 3 below `Entity`; behaviour that varies by kind is a strategy or data.
- [ ] Data: definitions are immutable, keyed by kebab-case IDs that never change; no magic numbers.
- [ ] Determinism and testability: seams exist (ports, fake schedulers) so the design is testable
      headlessly; a determinism test is possible.
- [ ] Observability: the design emits `GameEvents` and has at least one invariant where state can
      go wrong.
- [ ] Portability: nothing platform-specific leaks into `packages/core`.
- [ ] Documented: architecture doc updated with `paths` frontmatter; ADR if a decision changed.

## 4. Phase exit checklist

- [ ] Every sprint checklist in the phase doc is ticked or explicitly deferred to the backlog.
- [ ] Success metrics in the phase doc measured and recorded in `PROGRESS.md` (numbers, not adjectives).
- [ ] Coverage thresholds raised to the phase target; soak/replay corpus green.
- [ ] Docs gardened (`npm run docs:check` green; `last-reviewed` refreshed on touched docs).
- [ ] Changelog entry for the phase in `docs/changelog/`; ADRs for decisions made during the phase.
- [ ] Phase PR into `main` opened with the demo script from the phase doc; reviewer assigned;
      next phase branch created from this phase branch (`docs/process/git-workflow.md`).
- [ ] `/ponytail-audit` run on the whole repo and `/ponytail-debt` harvested; accepted cuts
      and every `ponytail:` shortcut turned into backlog entries or INBOX items.
- [ ] Retrospective held; findings turned into INBOX items or backlog entries.

## Related

- [`running-agents.md`](running-agents.md)
- [`../process/git-workflow.md`](../process/git-workflow.md)
- [`../process/guardrails.md`](../process/guardrails.md)
- [`../architecture/17-extension-recipes.md`](../architecture/17-extension-recipes.md)
