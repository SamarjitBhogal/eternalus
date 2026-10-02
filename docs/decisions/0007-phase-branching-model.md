---
title: 0007. Phase integration branches with stacked PRs
description: The git model for a five-person team whose lead architect does not own main - long-lived phase branches, task PRs into them, one PR per phase into main, and the next phase stacked on the previous one while its PR waits; read this before creating a branch.
audience: [humans, agents]
status: active
owner: sholtzman
last-reviewed: 2026-09-30
tags: [adr, git, process]
related: ['docs/process/git-workflow.md', 'docs/plan/README.md']
---

# 0007. Phase integration branches with stacked PRs

- Status: accepted (product owner decision, 2026-09-30)
- Date: 2026-09-30

## Context

The product owner requires that nothing reaches `main` until a phase of the plan is complete,
that work continues while a phase PR waits for review, and that PRs can sit unapproved without
blocking anyone. `main` is owned by SamarjitBhogal and is protected (PR + one approval + green
CI). Five people and several AI agents work in parallel.

Options considered:

1. Phase integration branches (`phase/<n>-<name>`), task branches PR into them, one PR per
   phase into `main`, next phase stacked on the previous branch.
2. Trunk-based: every task PR goes straight to `main`; phases are milestones/tags only.
3. Release-branch hybrid with feature flags on `main`.

## Decision

**Option 1.** It is the only model that satisfies "no commits to main until a phase is done"
while keeping day-to-day PRs small and reviewable inside the phase. The procedure (branch
names, base branches, the `git rebase --onto` step after a squash-merge lands, reviewer
rotation, what to do when a phase PR is rejected) is written in
`docs/process/git-workflow.md`.

## Consequences

- Phase branches are shared and protected like `main` (no force-push; PRs only).
- Phase PRs are large by construction; the phase doc's demo script and checklist are the
  review guide, and task PRs were already reviewed individually.
- Squash-merging a phase PR rewrites history relative to the stacked next phase; the rebase
  step is mandatory and documented. Prefer "rebase and merge" or a merge commit for phase PRs
  if the repository settings allow it, to avoid the rewrite entirely.
- Hotfixes to `main` (if ever needed) are cherry-picked into the open phase branch.
