# Working with AI agents

For humans who run coding agents (Claude Code, Copilot, Cursor, Gemini CLI, ...) on this repo.
The agents' own rules are in `AGENTS.md`.

## 1. Scoping a task

Agents do well with small, concrete tasks and badly with vague ones.

- **One concern per task.** "Add a health component and system" is fine; "add combat" is not.
- **Write acceptance criteria** a reviewer can check.
- **Name the location** if you know it ("in `core/src/systems/`").
- **Point at the rules**: `AGENTS.md` and `CONTRIBUTING.md` say where code goes and how files are
  split.
- **Say what is out of scope.** Agents tend to "improve" nearby code.
- **Do not ask an agent to make design decisions.** Decide first, then delegate.

A good prompt:

> Add a `Health` component in `packages/core/src/components/` with `current` and `max`, clamped
> to `[0, max]`, following `AGENTS.md`. Put the default `maxHealth` in `content/`. Out of scope:
> damage, UI. Done when `npm run check` passes.

## 2. Commits and pushes

Agents **do not commit or push** unless you ask them to in that task (rule in `AGENTS.md`).
Review the working-tree diff first, then commit yourself or tell the agent to commit.

## 3. Running agents in parallel

Each agent gets its own branch **and** its own git worktree, so they never share a working
directory, `node_modules` state or half-finished edits.

```bash
git worktree add .worktrees/health-system -b feat/health-system main
cd .worktrees/health-system
npm install
# start the agent in this directory
```

- `.worktrees/` is gitignored.
- Give parallel agents tasks that touch **different files**, or expect merge conflicts.
- Clean up when merged: `git worktree remove .worktrees/health-system`.

## 4. Reviewing an AI-generated PR

CI proves the checks pass. Your review catches what the checks can't. Go through this list:

- [ ] **Did tests change?** Read every modified test. Were assertions removed, loosened
      (`toBe` → `toBeDefined`), or replaced with snapshots of wrong output?
- [ ] **Do the new tests test behaviour**, or do they just execute code for coverage?
- [ ] **New `eslint-disable`, `@ts-expect-error`, `as` casts, or `!` assertions?** Each needs
      a convincing reason.
- [ ] **New dependencies?** Is each one approved and justified in the PR description?
- [ ] **Guardrail configs touched?** (`eslint.config.js`, tsconfigs, `vitest.config.ts`, hooks, CI) Check _why_.
- [ ] **Scope:** does the diff stay within the task? Look for drive-by renames, reformatting,
      "cleanups".
- [ ] **Placement:** is the code in the layer `docs/architecture.md` says?
- [ ] **Invented APIs:** does it call library functions that don't exist in our versions?
- [ ] **Product decisions:** did the agent pick gameplay numbers or behaviour nobody asked for?

## 5. Recovering from a bad agent change

- **Not merged yet:** close the PR or reset the branch. Don't try to talk the agent into
  patching a fundamentally wrong approach; re-scope the task and start fresh.
- **Already merged:** **revert the PR** (`git revert` via a new PR). Do not patch on top of a
  bad change: the revert restores a known-good `main`, and the fix can then be redone properly.
- Afterwards, ask what guardrail or rule would have caught it, and propose it (ADR).
