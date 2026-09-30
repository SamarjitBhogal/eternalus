---
title: Task brief template
description: The copy-paste brief for handing one concern to a teammate or a coding agent, with a filled example; read this before writing a prompt or an issue.
audience: [humans]
status: active
owner: sholtzman
last-reviewed: 2026-09-30
tags: [agents, process, template]
related: ['docs/agents/running-agents.md', 'docs/agents/checklists.md']
---

# Task brief template

**Purpose.** Agents (and people) do well with small, concrete tasks and badly with vague ones.
This is the same structure as the GitHub issue template `.github/ISSUE_TEMPLATE/task-brief.md`,
for use directly in a prompt or `INBOX.md`.

## Template

```text
Task: <verb> <thing>                         (one concern; not "add combat")
Phase/sprint: P<n>.<s> — <checklist line in docs/plan/phase-<n>-*.md>
Location: <folder per docs/architecture/02-code-structure.md>
Source: <FR-/NFR- ids, reference doc section, ADR>   (no product decisions in the task)
Acceptance criteria:
  - <observable behaviour 1>
  - <observable behaviour 2>
Tests: <which tests, next to which files; determinism test if core>
Docs: <which docs/frontmatter to update; PROGRESS.md entry>
Out of scope: <what not to touch>
Done when: npm run check passes; PR into phase/<n>-<name>; PROGRESS.md entry appended.
```

## Filled example

```text
Task: add the Health component with layered shield bars
Phase/sprint: P2.1 — "Health with layered shields" in docs/plan/phase-2-structures-and-combat.md
Location: packages/core/src/components/Health.ts (+ Health.types.ts, Health.test.ts)
Source: FR "structures & defences" shield rule; docs/reference/game-design/03-structures-and-defenses.md
        (buff-tower shield math); docs/architecture/07-structures-obstacles-and-destructibles.md §2
Acceptance criteria:
  - Health has base current/max clamped to [0, max] and an ordered list of shield bars
    {sourceId, current, max}.
  - applyDamage(amount, sourceId) drains shield bars in order before base health and returns
    the breakdown.
  - removeShield(sourceId) removes only that bar; base health is untouched.
  - Worked example passes: base 1000 + three bars of 1500 = 4500 effective.
Tests: Health.test.ts covering the four criteria plus over-damage and zero-damage edge cases.
Docs: none beyond TSDoc; PROGRESS.md entry.
Out of scope: DamagePipeline, StructureSystem, UI.
Done when: npm run check passes; PR into phase/2-structures-and-combat; PROGRESS.md entry.
```

## Related

- [`running-agents.md`](running-agents.md) §1 (scoping)
- [`checklists.md`](checklists.md)
