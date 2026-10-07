---
title: 0012. Agents push task branches and open PRs
description: Claude Code sessions may push their own task branch and open its pull request when the human asks, while force pushes, pushes to protected branches and merges stay human-only; read this before pushing from an agent session or changing the push rules in .claude/settings.json.
audience: [humans, agents]
status: active
owner: sholtzman
last-reviewed: 2026-10-07
tags: [adr, process, git, guardrail, agents]
related:
  [
    'AGENTS.md',
    'docs/agents/tool-setup.md',
    'docs/process/git-workflow.md',
    'docs/decisions/0007-phase-branching-model.md',
    'docs/decisions/0010-pre-pr-critic-and-ponytail-gate.md',
  ]
---

# 0012. Agents push task branches and open PRs

- Status: proposed (the product owner asked for it in the session F chat, 2026-10-07)
- Date: 2026-10-07

## Context

`.claude/settings.json` denied every form of `git push`, so only humans pushed and opened PRs
(`docs/agents/tool-setup.md`, `docs/process/git-workflow.md` §7). Sprint 1 runs eight parallel
sessions, each finishing with the pre-PR gate (ADR 0010); every finished branch then waited for
the owner to push it and open its PR by hand. The owner asked for sessions to push and open PRs
themselves.

## Decision

- **Allowed (when the human asks in the current task, `AGENTS.md`):** `git push -u origin
<task-branch>` and `gh pr create` for the session's own task branch, into its phase branch.
  `.claude/settings.json` allows `Bash(git push -u origin *)` and `Bash(gh pr create *)` and no
  longer denies `git push`.
- **Still denied:** force pushes in any position (`git push --force…`, `-f…`, and the same flags
  after the branch name), pushes naming `main` or a `phase/` branch, `git commit --no-verify`,
  `git reset --hard`, deleting branches.
- **Still human-only:** merging PRs, pushing `main` or a phase branch, the one allowed
  force-with-lease on a phase branch (ADR 0007), tags.
- Always name the branch: task branches track `origin/phase/<n>-…`, so a bare `git push` aims at
  the phase branch.

Options considered: keep humans pushing (the bottleneck stays); allow `git push *` (also allows
pushes to `main` and phase branches).

## Consequences

- Easier: a session hands over an open PR with its gate results instead of a local branch.
- Harder: permission patterns are best-effort (tool-setup notes): the deny rules catch
  `git push … main` and `git push … phase/…`, not every spelling (`HEAD:main`, a bare
  `git push` with a phase upstream). GitHub branch protection covers `main` only
  (`guardrails.md` §5), so a phase branch also relies on the agent following this ADR.
- Watch: a PR opened by an agent still needs a human review and merge; the PR description must
  carry the pre-PR gate results (ADR 0010).
