---
title: Agentic instructions
description: Agent-agnostic requirements AI-01 to AI-12 for work done by coding agents (the harness contract, task briefs, what agents never and always do, verification, context rules, human review, escalation); read before briefing, running or reviewing an agent, or if you are one.
audience: [humans, agents]
status: draft
owner: sholtzman
last-reviewed: 2026-09-30
tags: [requirements, agents, harness, verification]
paths:
  [
    'AGENTS.md',
    'CLAUDE.md',
    'GEMINI.md',
    '.claude/**',
    '.github/**',
    'docs/agents/**',
    'docs/plan/PROGRESS.md',
  ]
related:
  [
    'docs/architecture/16-agentic-harness.md',
    'docs/agents/README.md',
    'docs/research/agentic-harness-research.md',
  ]
---

# Agentic instructions

Purpose: Read this when you write a task for a coding agent, run one, review its pull request, or
are an agent starting work in this repository. These are the requirements behind
[`AGENTS.md`](../../AGENTS.md), which stays the compact, canonical contract every agent loads;
this document explains what the contract must guarantee and why, independent of any one tool
(Claude Code, Codex/ChatGPT, Gemini/Antigravity, Copilot, Cursor). The harness design itself is in
[`../architecture/16-agentic-harness.md`](../architecture/16-agentic-harness.md); how to run
agents day to day is in [`../agents/`](../agents/README.md). Requirement IDs are `AI-nn`.

## The contract

### AI-01 `AGENTS.md` is canonical; tool files only point to it

- **Requirement.** The root `AGENTS.md` and the nested `packages/core/AGENTS.md` and
  `apps/client/AGENTS.md` are the only sources of agent rules. Tool-specific files carry no rules
  of their own: `CLAUDE.md` contains `@AGENTS.md`; `GEMINI.md` (or `.gemini/settings.json`
  `context.fileName`) points at `AGENTS.md`; Copilot instruction files and Cursor rules restate a
  boundary in one line and link. None of these files has frontmatter. Any rule change is made in
  `AGENTS.md` first and mirrored, never the reverse. `AGENTS.md` stays short (under ~200 lines)
  and links into `docs/` rather than repeating it.
- **Why.** Five people use different tools; one file prevents drift. `AGENTS.md` is the
  cross-tool standard and the `@AGENTS.md` import is the documented, Windows-safe way to share it
  ([`../research/agentic-harness-research.md#1-the-agentsmd-standard`](../research/agentic-harness-research.md#1-the-agentsmd-standard)).
  Long instruction files crowd out the task and rot
  ([`#4`](../research/agentic-harness-research.md#4-openais-harness-engineering-and-other-2026-sources)).

### AI-02 Every task starts from a brief

- **Requirement.** Work is delegated only through a brief that follows
  [`../agents/task-brief-template.md`](../agents/task-brief-template.md) and contains: one
  concern; acceptance criteria a reviewer can check; the location (folder, layer); what is out of
  scope; the requirement IDs it delivers; the docs to read (AI-06); and "done when" (normally
  "`npm run check` passes and the acceptance criteria hold"). A brief never delegates a product or
  design decision; decide first, then delegate.
- **Why.** Agents do well with small concrete tasks and badly with vague ones; a brief is also
  the reviewer's checklist ([`../agents/running-agents.md`](../agents/running-agents.md)).

### AI-03 What agents never do

- **Requirement.** The forbidden actions in [`AGENTS.md`](../../AGENTS.md) are requirements, not
  preferences. An agent never: weakens a guardrail to make a check pass (`eslint-disable` without
  rule and reason, `@ts-ignore`, `any`, skipped or deleted tests, weakened assertions, lowered
  coverage); adds a dependency or edits `package-lock.json` by hand; makes a product or
  game-design decision (including picking gameplay numbers nobody asked for); commits, pushes,
  merges, rebases or tags unless the human asked in the current task; performs drive-by refactors,
  renames or reformatting outside the task; invents library APIs; adds assets without a licence;
  edits requirement or decision documents on its own.
- **Why.** Each item traces to a failure mode the research documents: agents "declare the job
  done", grade themselves generously, and improve nearby code they were not asked to touch.

### AI-04 What agents always do

- **Requirement.** An agent always: reads the nearest `AGENTS.md` and the docs in AI-06 before
  editing; runs `npm run check:quick` after each meaningful edit and `npm run check` before
  declaring done; reports the check result verbatim (AI-11); ships tests with every behaviour
  change and a failing-first test with every bug fix; updates the docs and frontmatter that OG-06
  requires; appends one line to [`../plan/PROGRESS.md`](../plan/PROGRESS.md) (date, branch, task,
  outcome, evidence); leaves changes uncommitted for review unless told otherwise; says plainly
  when something is not done.

## Verification

### AI-05 Tests are the oracle, and a separate evaluator grades the work

- **Requirement.** The pass/fail signal for agent work is the automated gate (`npm run check`:
  format, lint with zero warnings, typecheck, knip, tests with coverage thresholds, build) plus the
  acceptance criteria in the brief. Before a task is called done, an **independent pass** reviews
  it: a fresh-context reviewer agent or a second session, given only the brief and the diff, told
  to report correctness and scope gaps only. The generating agent's own summary is never accepted
  as evidence.
- **Why.** Anthropic's harness guidance found that agents "reliably skew positive when grading
  their own work" and recommends a skeptical evaluator separate from the generator
  ([`../research/agentic-harness-research.md#3-anthropic-engineering-guidance`](../research/agentic-harness-research.md#3-anthropic-engineering-guidance));
  the verification patterns available without new dependencies are listed in
  [`#5`](../research/agentic-harness-research.md#5-verification-patterns). Tests only count if
  they connect to real code: "If tests dont actually connect, they dont really exist"
  ([source](source/requirements-of-architecture.md)).

### AI-06 Context rules: read the right three documents, not everything

- **Requirement.** Before coding, an agent reads (1) the nearest `AGENTS.md`; (2) the
  architecture doc whose `paths` frontmatter matches the files it will touch (find it through
  [`../README.md`](../README.md)); (3) the current phase doc and sprint in
  [`../plan/`](../plan/README.md), including the task's checklist item. It retrieves other docs
  just in time (by path or search) and does not paste whole documents into its context. Between
  unrelated tasks it starts a fresh context.
- **Why.** Context is a finite attention budget; repository overviews cost tokens without
  improving success, while targeted instructions are followed
  ([`#3`](../research/agentic-harness-research.md#3-anthropic-engineering-guidance),
  [`#4`](../research/agentic-harness-research.md#4-openais-harness-engineering-and-other-2026-sources)).

### AI-07 Humans review AI pull requests against the checklist

- **Requirement.** A human reviews every agent PR with
  [`../agents/checklists.md`](../agents/checklists.md): CI proves the checks; the reviewer reads
  every changed test, looks for weakened assertions, new escapes (`eslint-disable`,
  `@ts-expect-error`, `as`, `!`), scope creep, placement in the wrong layer, invented APIs and
  unrequested product decisions. A bad change is reverted or the branch re-scoped, never patched
  into shape.
- **Why.** Automated gates catch what they encode; review catches the rest, and reverting keeps
  `main` at a known-good state ([`../agents/running-agents.md`](../agents/running-agents.md)).

### AI-08 Escalation: stop and ask

- **Requirement.** An agent stops and reports, instead of working around, whenever: a guardrail
  blocks a legitimate change; a requirement or acceptance criterion is ambiguous; the task needs a
  product decision, a new dependency, a new top-level folder or a change to a requirement or ADR;
  the scope grows beyond the brief; an existing test looks wrong; two instructions conflict. The
  report names the conflict and proposes options; a human decides (through an ADR when a guardrail
  or requirement is involved).
- **Precedence for agents.** The explicit task brief (within policy) > the nearest `AGENTS.md` >
  [`docs/requirements/`](README.md) > `CONTRIBUTING.md`. A brief can narrow the rules, never
  loosen them.

## Working practices

### AI-09 Parallel agents: one task, one branch, one worktree, disjoint files

- **Requirement.** Each agent runs on its own branch in its own git worktree with its own
  `npm ci`; parallel tasks touch disjoint file sets; the reviewer runs in the worktree of the task
  it reviews. Setup and cleanup: [`../agents/running-agents.md`](../agents/running-agents.md).
- **Why.** Shared working trees and `node_modules` produce half-finished edits and false failures
  ([`#6`](../research/agentic-harness-research.md#6-multi-agent-and-parallel-work)).

### AI-10 Harness hygiene: every control is traceable and tested

- **Requirement.** Every rule in `AGENTS.md`, every hook and every permission entry records the
  failure it prevents and an expiry condition; hooks are tested both ways (must block, must allow);
  mechanical checks are preferred to prose ("double or replace rules with scripts"); the harness
  is audited at each gardening pass (OG-08) and after each model release, deleting dead scaffolding
  first. Adding a control is a PR that cites the incident.
- **Why.** Harnesses rot; the 2026 surveys found most have neither tests nor evals
  ([`#4`](../research/agentic-harness-research.md#4-openais-harness-engineering-and-other-2026-sources)).

### AI-11 Evidence, not assertions

- **Requirement.** The agent's final message and the PR's "How it was tested" section contain the
  verbatim tail of `npm run check` (or the failing step), the list of tests added, and, for UI or
  rendering work, what was checked in the browser. "All checks pass" without output is not
  evidence. If a check fails, the message says so and stops; the task is not done.

### AI-12 Multi-session work uses the plan, not memory

- **Requirement.** Work that spans sessions is tracked in the phase doc's checklist and
  `PROGRESS.md`; an agent may tick only items it verified with a passing check in that session.
  Recommendation: for long autonomous runs, keep a machine-readable feature list
  (`docs/plan/<task>.json` with `passes: false` entries) that agents may only flip to `true`, as
  Anthropic's long-running harness pattern describes
  ([`#3`](../research/agentic-harness-research.md#3-anthropic-engineering-guidance)); a
  `SessionStart` hook that prints recent git log, status and the progress tail gives every fresh
  context the same starting ritual.

## Related

- [`../../AGENTS.md`](../../AGENTS.md): the canonical contract (definition of done, git rules, forbidden actions, commands)
- [`../architecture/16-agentic-harness.md`](../architecture/16-agentic-harness.md): the harness design (files, hooks, permissions, skills)
- [`../agents/README.md`](../agents/README.md), [`../agents/running-agents.md`](../agents/running-agents.md), [`../agents/task-brief-template.md`](../agents/task-brief-template.md), [`../agents/checklists.md`](../agents/checklists.md)
- [`../process/guardrails.md`](../process/guardrails.md): what the automated gate enforces and how to change it
- [`../research/agentic-harness-research.md`](../research/agentic-harness-research.md): the evidence behind these requirements
- [`05-engineering-standards.md`](05-engineering-standards.md): the testing and verification standards agents must meet
