---
title: Running AI agents on this repo
description: For humans who run coding agents (Claude Code, Codex, Gemini/Antigravity, Copilot, Cursor) - how to scope a task, branch and worktree conventions, the INBOX and PROGRESS files, reviewing an AI-generated PR and recovering from a bad change; read this before delegating work to an agent.
audience: [humans]
status: active
owner: sholtzman
last-reviewed: 2026-10-08
tags: [agents, process, review, git]
related: ['docs/agents/README.md', 'docs/agents/checklists.md', 'docs/process/git-workflow.md']
---

# Running AI agents on this repo

**Purpose.** Read this when you are the human driving an agent. The agents' own rules are in
`AGENTS.md`; the harness that enforces them is described in
[`README.md`](README.md) and [`tool-setup.md`](tool-setup.md).

## 1. Scoping a task

Agents do well with small, concrete tasks and badly with vague ones.

- **One concern per task.** "Add a health component and system" is fine; "add combat" is not.
- **Write acceptance criteria** a reviewer can check ([`task-brief-template.md`](task-brief-template.md)).
- **Name the location** if you know it ("in `packages/core/src/systems/`", per
  [`../architecture/02-code-structure.md`](../architecture/02-code-structure.md)).
- **Point at the rules**: `AGENTS.md` and `CONTRIBUTING.md` say where code goes and how files
  are split; the architecture doc with a matching `paths:` frontmatter says how it is designed.
- **Say what is out of scope.** Agents tend to "improve" nearby code.
- **Do not ask an agent to make design or product decisions.** Decide first (ADR, reference
  doc, INBOX answer), then delegate.

A good prompt:

> Add a `Health` component in `packages/core/src/components/` with `current` and `max`, clamped
> to `[0, max]`, following `AGENTS.md` and `docs/architecture/04-entity-architecture.md` §3. Put
> the default `maxHealth` in `content/`. Out of scope: damage, UI. Done when `npm run check`
> passes and `docs/plan/PROGRESS.md` has an entry.

## 2. Branches, INBOX and PROGRESS

- Work happens on a task branch off the current phase branch:
  `git switch -c feat/<task> phase/<n>-<name>` (naming and the stacked-PR flow are in
  [`../process/git-workflow.md`](../process/git-workflow.md)). Never on `main`.
- Agents **do not commit or push** unless you ask them to in that task (rule in `AGENTS.md`).
  Review the working-tree diff first, then commit yourself or tell the agent to commit.
- `INBOX.md` (repo root) is the product owner's queue: requests, feedback and decisions. Saying
  "file updated" in chat tells the agent to read it and treat open items as the prompt. Items
  leave the file only when implemented and confirmed.
- `docs/plan/PROGRESS.md` is the append-only log every task ends with (date, phase/sprint,
  branch, what, verbatim checks, next step). It is the shared memory between sessions and tools.

## 3. Running agents in parallel

Each agent gets its own branch **and** its own git worktree, so they never share a working
directory, `node_modules` state or half-finished edits.

```bash
git worktree add .worktrees/health-system -b feat/health-system phase/2-structures-and-combat
cd .worktrees/health-system
npm install
# start the agent in this directory (or: claude --worktree health-system)
```

- `.worktrees/` and `.claude/worktrees/` are gitignored, and the root ESLint config ignores them
  too, so one unfinished worktree never fails lint in another checkout (DEC-16).
- Give parallel agents tasks that touch **different files**, or expect merge conflicts.
- Clean up when merged: `git worktree remove .worktrees/health-system`.

## 4. Reviewing an AI-generated PR

CI proves the checks pass. Your review catches what the checks can't, and a second agent can
do the first pass (`/pr-review` skill or the `architecture-reviewer` subagent): agents grade
their own work generously, so never let the author agent be the only reviewer. Walk
[`checklists.md`](checklists.md) §2; the highlights:

- [ ] **Did tests change?** Read every modified test. Were assertions removed, loosened
      (`toBe` → `toBeDefined`), or replaced with snapshots of wrong output?
- [ ] **Do the new tests test behaviour**, or do they just execute code for coverage?
- [ ] **New `eslint-disable`, `@ts-expect-error`, `as` casts, or `!` assertions?** Each needs a
      convincing reason.
- [ ] **New dependencies?** Is each one approved and justified in the PR description?
- [ ] **Guardrail configs touched?** (`eslint.config.js`, tsconfigs, `vitest.config.ts`, hooks,
      CI, `.claude/settings.json`) Check _why_; there must be an ADR.
- [ ] **Scope:** does the diff stay within the task? Look for drive-by renames, reformatting,
      "cleanups".
- [ ] **Placement:** is the code in the layer and folder `docs/architecture/02-code-structure.md` says?
- [ ] **Invented APIs:** does it call library functions that don't exist in our versions?
- [ ] **Product decisions:** did the agent pick gameplay numbers or behaviour nobody asked for?
- [ ] **Docs and PROGRESS:** updated, with `last-reviewed` bumped?

## 5. Recovering from a bad agent change

- **Not merged yet:** close the PR or reset the branch. Don't try to talk the agent into
  patching a fundamentally wrong approach; re-scope the task and start fresh.
- **Already merged:** **revert the PR** (`git revert` via a new PR). Do not patch on top of a
  bad change: the revert restores a known-good branch, and the fix can then be redone properly.
- Afterwards, ask what guardrail or rule would have caught it, and propose it (ADR, hook,
  lint rule, invariant).

## Related

- [`README.md`](README.md) — harness overview and reading order
- [`tool-setup.md`](tool-setup.md)
- [`checklists.md`](checklists.md)
- [`../process/git-workflow.md`](../process/git-workflow.md)
