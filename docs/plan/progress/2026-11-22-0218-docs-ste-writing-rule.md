---
title: 'Progress 2026-11-22: docs/ste-writing-rule (ASD-STE100 writing rule)'
description: 'Owner request, Claude Code: AGENTS.md gets a writing-style rule; all text for a person or an agent is at least 80% ASD-STE100.'
audience: [humans, agents]
status: active
owner: sholtzman
last-reviewed: 2026-11-22
tags: [plan, progress, log]
---

# Progress 2026-11-22: docs/ste-writing-rule (ASD-STE100 writing rule)

Harness / process · docs/ste-writing-rule · Claude Code (PR-REVIEW-COORDINATION-16)

- What was done: added the section "Writing style (ASD-STE100)" to `AGENTS.md`, on Sam's request
  (2026-11-22). Messages to the owner and to agents, owner question forms, PR text, review
  comments, commit messages and docs are now at least 80% ASD-STE100. The `CLAUDE.md`, `GEMINI.md`
  and Copilot files only point to `AGENTS.md`, so they get the rule without an edit.
- Checks run: `npm run check` → exit 0 (core 1683 tests, protocol 29, client 2077, server 84,
  "Documentation check passed.").
- Next step: Sam pushes the branch and opens the PR (pre-PR gate first).
