---
title: 0018. CodeRabbit runs the pr-review skill
description: CodeRabbit reviews every PR by the pr-review skill, fails one blocking check on the skill's blockers and approves or requests changes; its approval merges task PRs into phase branches, while phase PRs into main and PRs that touch review or guardrail config still need a teammate; read this before changing .coderabbit.yaml, the branch rules or the PR approval rules.
audience: [humans, agents]
status: active
owner: sholtzman
last-reviewed: 2026-10-27
tags: [adr, process, review, guardrail, agents]
related:
  [
    '.claude/skills/pr-review/SKILL.md',
    'docs/agents/checklists.md',
    'docs/process/guardrails.md',
    'docs/process/git-workflow.md',
    'docs/process/sdlc.md',
    'docs/agents/tool-setup.md',
    'docs/decisions/0007-phase-branching-model.md',
    'docs/decisions/0010-pre-pr-critic-and-ponytail-gate.md',
  ]
---

# 0018. CodeRabbit runs the pr-review skill

- Status: accepted (team decision including the product owner, 2026-10-27; recorded on PR #48)
- Date: 2026-10-27

## Context

The `pr-review` skill requires a second pass by a different agent or a human before merge
(`docs/agents/checklists.md` §2), but it only runs when someone starts it, and every task PR
waited on a teammate's approval. The team wants an automatic reviewer that applies the same
rules to every PR and, for routine task PRs, can approve without a teammate.

CodeRabbit (GitHub app, repo allowlisted) fits, with three limits that shape the decision:

- it cannot load a Claude skill, so the skill reaches it as guidelines and instructions;
- it cannot run `npm run check`, and it may approve before CI finishes;
- it reads `.coderabbit.yaml` from the PR branch, so a PR can change its own reviewer's rules.

Its approval counts toward GitHub's required approvals, and any actionable inline comment it
posts makes it request changes.

## Decision

1. **Review by the skill.** `.coderabbit.yaml` loads the skill, the checklists, the
   architecture docs, `guardrails.md`, `CONTRIBUTING.md` and every `AGENTS.md` as guidelines.
   A path instruction tells it to follow the skill, judge against the base branch's docs, use
   the violation / acceptable / better-than-design classification, and post only `blocker`
   findings as actionable inline comments (`should-fix` and `nit` go in the summary).
2. **One blocking check.** The pre-merge check "pr-review skill verdict" (`mode: error`) fails
   only on the skill's blockers: guardrail weakening and product decisions by an agent. Only
   requested reviewers can override it.
3. **Approve or request changes.** Automatic approvals are on for PRs into `main` and
   `phase/*`, drafts included. Authors cannot run `@coderabbitai approve` or `resolve` on their
   own PR.
4. **Who must approve.**
   - Task PR into `phase/*`: one approval; CodeRabbit's is enough.
   - Phase PR into `main`: a Code Owner (teammate) approval (`.github/CODEOWNERS` lists only
     people).
   - Any PR that touches review or guardrail config, the `pr-review` skill included:
     CodeRabbit withholds approval (`auto_approvals.overrides`), so a teammate approves.
5. **CI gates every merge.** The three `npm run check` jobs are required checks on `phase/*`
   and should be on `main` (`guardrails.md` §5), so an approval never merges red code.

## Options considered

- **Path instructions only:** advisory, cannot approve or request changes. Rejected; the team
  wants approvals.
- **A blocking check for every checklist item:** LLM judgement on items such as "has tests"
  would block merges wrongly, and the skill names fewer blockers. Rejected.
- **Teammate approval on every PR:** the status quo. Rejected for task PRs; kept for phase PRs
  and config changes.

## Consequences

- Easier: every PR gets the skill's review at once, and routine task PRs merge without waiting
  for a teammate.
- Harder: `.coderabbit.yaml` is a guardrail config (`guardrails.md` §1); changing it needs an
  ADR and a teammate's approval.
- Watch: a PR can delete the approval override in the same diff that weakens the config, so
  reviewers read every `.coderabbit.yaml` change. CodeRabbit's verdicts are LLM judgement; a
  bad merge it approved is a reason to revisit this ADR.
