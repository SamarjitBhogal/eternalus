---
title: 0018. CodeRabbit runs the pr-review skill
description: CodeRabbit reviews every PR by the pr-review skill, fails one blocking check on the skill's blockers and approves or requests changes; its approval merges task PRs into phase branches, while phase PRs into main and PRs that touch review or guardrail config still need a teammate; amended 2026-10-30 so that CodeRabbit never approves, a person approves every PR, taste, design and architecture decisions go to the product owner and its learnings are logged for the product owner's review; read this before changing .coderabbit.yaml, the branch rules or the PR approval rules.
audience: [humans, agents]
status: active
owner: sholtzman
last-reviewed: 2026-10-30
tags: [adr, process, review, guardrail, agents]
related:
  [
    '.claude/skills/pr-review/SKILL.md',
    'docs/agents/checklists.md',
    'docs/process/guardrails.md',
    'docs/process/git-workflow.md',
    'docs/process/sdlc.md',
    'docs/agents/tool-setup.md',
    'docs/agents/coderabbit-learnings.md',
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

## Amendment 2026-10-30 (product owner)

The product owner confirmed agreeing to this ADR at the team meeting: "Yes, I agreed at the
team meeting." The owner suggested it so that CodeRabbit runs the same `pr-review` skill "to
reduce the amount of edits i need to make in pr reviews". The owner's rulings on the PR #48
review (DEC-95 to DEC-98 in the owner decisions log) change the decision as below. Where the
text above disagrees, this section wins.

1. **Taste, design and architecture decisions go to the product owner** (DEC-95): "taste and
   design decisions are still for me to make, so they must be given to me." They are anything
   a player sees or feels (in-game names, UI, visuals, gameplay rules and numbers) and every
   architecture or design-doc change; code identifiers are not. CodeRabbit posts each one that
   the base-branch docs do not already make as a blocker that mentions the product owner, and
   the blocking check fails until the owner signs it off. This gives visibility, not a veto: a
   teammate can still override the check (see the limits below) and approve.
2. **CodeRabbit blocks; only people approve** (DEC-96). It keeps the blocking check and requests
   changes, but never approves: one `auto_approvals.overrides` entry without paths withholds
   approval on every PR. This replaces Decision 4 and the "routine task PRs merge without
   waiting for a teammate" consequence. Every PR needs an approval from a person who did not
   write it, as AI-07 in the agentic-instructions requirements ("A human reviews every agent
   PR") and ES-13 in the engineering standards ("for agent PRs, a human") require; both stay
   unchanged. GitHub enforces it with Code Owner review on `phase/**` and `main`
   (`.github/CODEOWNERS` lists only people), so a PR cannot lift it by editing
   `.coderabbit.yaml`.
3. **Nobody's text is a sign-off for someone else** (DEC-96): "absolutely not. this will let
   anyone accept a pr." A sign-off counts only from the person who gives it: their own
   approving review or comment on the PR, their own description on a PR they wrote, or an
   accepted ADR or decisions-log row already on the base branch. The author cannot sign off for
   another person in the PR description, commits, replies or files the PR adds or edits, an ADR
   it marks accepted included.
4. **Drafts are not reviewed** (DEC-97): PRs into `main` and `phase/*`, once they are ready.
5. **Learnings stay in this repo and are logged for the product owner** (DEC-98). Scope
   `local`; an admin approves or rejects each new chat learning within 7 days, after which it
   applies. The stored learning "Do not require a separate human approval for task PRs into
   phase/\*" is deleted. Every 2 days `.github/workflows/coderabbit-learnings.yml` copies every
   learning CodeRabbit announced on a PR into `docs/agents/coderabbit-learnings.md` and opens a
   docs PR. The product owner reviews them there and asks the admin to reword or delete one;
   learning does not wait for that review. CI also starts on `workflow_dispatch`, because a
   push by the workflow's token starts no workflow; the learnings workflow uses it to run CI on
   its docs branch.

Limits the text above did not state:

- CodeRabbit may read its guidelines and this config from the PR head, so "judge against the
  base branch" is an instruction, not a guarantee. The hard rules live in GitHub settings.
- It cannot read `node_modules`, so it cannot catch invented library APIs; the human reviewer
  does.
- Learnings change its behaviour outside git; the approval delay and the log keep them visible.
  Two gaps remain. CodeRabbit also infers learnings itself during a review: those skip the
  admin, apply at once to their own PR and to other PRs once it merges, and may not be
  announced, so the log can miss them (the admin's CSV export on the Learnings page lists
  all). The log also depends on CodeRabbit's "Learnings added" reply format: the script fails
  on a block it cannot read, but not on a renamed heading.
- Agents open PRs with the human's `gh` login (ADR 0015), so on the product owner's own PRs a
  description an agent wrote counts as the owner's sign-off. The pre-PR critic is the only
  guard there.
- Who can override the failing check: requested reviewers and, on GitHub, any submitted
  reviewer who is an owner, member or collaborator. The PR author cannot.

### Implementation status (2026-10-30)

The repository admin sets Code Owner review on the `phase/**` ruleset, confirms CI checks and
Code Owner review on `main`, only then allows GitHub Actions to create and approve pull
requests, and deletes the stored learning in the CodeRabbit app. GitHub runs scheduled
workflows only from the default branch, so the learnings workflow starts when this change
reaches `main` (at the phase 2 merge, or earlier as a hotfix PR if the admin chooses); until
then, run `node scripts/coderabbit/collect-learnings.mjs` by hand.
