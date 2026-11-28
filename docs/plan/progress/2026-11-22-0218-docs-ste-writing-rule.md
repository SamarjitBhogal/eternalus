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

Harness / process · docs/ste-writing-rule · sholtzman + Claude Code

- What was done: added the section "Writing style (ASD-STE100, DEC-329)" to `AGENTS.md`, on the
  owner's request of 2026-11-22. Added the DEC-329 row (with his words) and one review item in
  `docs/agents/checklists.md` §2. Every `CLAUDE.md` only imports `AGENTS.md`, so it gets the rule
  without an edit.
- Checks run: `npm run check` → exit 0 (core 1683 tests, protocol 29, client 2077, server 84,
  "Documentation check passed."); `npm run docs:check` again after the last text edit → passed.
- Next step: Sam pushes the branch and opens the PR.
