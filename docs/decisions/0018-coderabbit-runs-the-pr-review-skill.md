---
title: 0018. CodeRabbit runs the pr-review skill
description: Proposed decision that CodeRabbit reviews every PR by the pr-review skill, with one blocking pre-merge check for the skill's blockers and automatic approve or request-changes, authors unable to approve their own PR by command; read this before changing .coderabbit.yaml or the PR approval rules.
audience: [humans, agents]
status: draft
owner: sholtzman
last-reviewed: 2026-10-27
tags: [adr, process, review, guardrail, agents]
related:
  [
    '.claude/skills/pr-review/SKILL.md',
    'docs/agents/checklists.md',
    'docs/process/guardrails.md',
    'docs/process/git-workflow.md',
    'docs/agents/tool-setup.md',
    'docs/decisions/0010-pre-pr-critic-and-ponytail-gate.md',
  ]
---

# 0018. CodeRabbit runs the pr-review skill

- Status: proposed (requested by SamarjitBhogal, 2026-10-27; awaits the product owner)
- Date: 2026-10-27

## Context

The `pr-review` skill says a second pass by a different agent or a human is required before
merge (`docs/agents/checklists.md` §2). Today that pass runs only when someone starts it. The
repo is now on CodeRabbit's allowlist, and the request is that every automated CodeRabbit
review follows the skill and can approve or request changes. CodeRabbit cannot load a Claude
skill and cannot run `npm run check`.

## Decision

`.coderabbit.yaml` configures CodeRabbit to:

- load the skill, the checklists, the architecture docs, `guardrails.md`, `CONTRIBUTING.md` and
  every `AGENTS.md` as code guidelines, and follow the skill through a path instruction that
  maps its severities and its three-way classification;
- run one pre-merge check in `error` mode that fails only on the skill's blockers (guardrail
  weakening, product decisions by an agent); other checklist items are review findings;
- review PRs into `main` and `phase/*`, drafts included;
- request changes on blocking findings and approve once they are resolved
  (`auto_approvals.enabled`), with `allow_author_approval: false` (authors cannot run
  `@coderabbitai approve` or `resolve` on their own PR; automatic approval still applies) and
  `override_requested_reviewers_only: true` (only requested reviewers can override a failing
  check).

Options considered: path instructions only (no approve or request changes; rejected, the
request asks for both); a blocking check for every checklist item (rejected, LLM judgement on
"has tests" would block merges wrongly, and the skill names fewer blockers).

## Consequences

- Easier: every PR gets the skill's review without anyone starting it.
- Harder: `.coderabbit.yaml` is now a guardrail config; changing it needs an ADR
  (`guardrails.md` §1 row "CodeRabbit review").
- Watch: CodeRabbit may approve before CI finishes, so CI must be a required check on every
  base branch it reviews. Open question for the product owner: does CodeRabbit's approval count
  toward the one required approval (`guardrails.md` §5)? Until this ADR is accepted, it does
  not; a teammate still approves.
