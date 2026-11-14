---
title: Bug tracker
description: The overview of known bugs in Eternalus, one row per bug linked to its Jira issue under the Bugs epic (SCRUM-433); read this before picking up a bug fix or to see what is broken right now.
audience: [humans, agents]
status: active
owner: SamarjitBhogal
last-reviewed: 2026-11-14
tags: [plan, bugs, jira]
related:
  [
    'docs/plan/PROGRESS.md',
    'docs/plan/README.md',
    'INBOX.md',
    'docs/reference/game-design/13-owner-decisions-log.md',
  ]
---

# Bug tracker

## Overview

Jira is the source of truth for each bug: its details, steps to reproduce, assignee and history.
This page gives the short overview so you can see everything that is open at a glance; agents
cannot read Jira, so the table is what they work from.

- **Epic:** [SCRUM-433 – Epic 11 – Bugs](https://comp7082-eternalus.atlassian.net/browse/SCRUM-433)
- **Board:** [SCRUM backlog](https://comp7082-eternalus.atlassian.net/jira/software/projects/SCRUM/boards/1/backlog)

## How to add a bug

1. Create a **Task** in Jira project SCRUM. Set its parent to SCRUM-433 and add the label `bug`.
   The project has no Bug issue type.
2. Add a row to the table below. Use the next `BUG-n` ID and link the Jira key.
3. Before filing, check the plan. If a phase doc, plan item or DEC row already schedules the
   work, file it anyway and name that item in Notes, so nobody builds it twice.
4. A fix that needs a product decision (a new number, a design change) gets an `INBOX.md`
   question; link it from Notes.
5. When the status changes, change Jira first; the row follows in the same PR as the fix. Once
   the bug is fixed, set the status to `Fixed` and put the PR in Notes. Keep the row: the table is
   the history of bugs.

Status values: `Open`, `Scheduled`, `In progress`, `Fixed`, `Won't fix`. `Scheduled` means a plan
item, phase or DEC row schedules all of the fix (DEC-249). Jira's To Do is `Open` or `Scheduled`,
In Progress is `In progress`, and Done is `Fixed` or `Won't fix`.

## Bugs

| ID    | Jira                                                                   | Title                                                    | Area           | Status    | Notes                                                                                                                                                                                                                                                                                                                                                                                                      |
| ----- | ---------------------------------------------------------------------- | -------------------------------------------------------- | -------------- | --------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| BUG-1 | [SCRUM-434](https://comp7082-eternalus.atlassian.net/browse/SCRUM-434) | Units show no health bar, so attacks look like they miss | client / views | Fixed     | PR #89 (DEC-195): a unit's bar shows once it has fought, until it dies.                                                                                                                                                                                                                                                                                                                                    |
| BUG-2 | [SCRUM-435](https://comp7082-eternalus.atlassian.net/browse/SCRUM-435) | Interior walls take long to break                        | core / content | Open      | Reported as "player attack is weak". Attack numbers match the spec. Owner ruling DEC-247: interior walls (inside the Stronghold ring and the Cathedral) keep the WallSegment health; to build: an attacker inside a building deals more damage to its walls. No plan item schedules it yet.                                                                                                                |
| BUG-3 | [SCRUM-436](https://comp7082-eternalus.atlassian.net/browse/SCRUM-436) | Minions do not attack obstacles or props                 | core / ai      | Open      | A design change request, not a defect. Owner ruling DEC-248 (amends DEC-193): a minion breaks a non-friendly obstacle in its way when that is faster than going around; otherwise it goes around. No plan item schedules it yet.                                                                                                                                                                           |
| BUG-4 | [SCRUM-437](https://comp7082-eternalus.atlassian.net/browse/SCRUM-437) | Developer menu not implemented (FR-096 to FR-099)        | client         | Scheduled | Scheduled across phases: `DeveloperMenu` v0 (Phase 1 sprint 1.5) and FR-098 spawns (Phase 2 sprint 2.7) are overdue; FR-099 sim mode is Phase 3 sprint 3.8 (now); FR-096 and FR-097 complete in Phase 5 sprint 5.5. Free camera (Ctrl+Shift+F3) and wheel zoom work. Teleport is in no requirement: raise it as a feature request. In flight: PRs #107, #109 and #112 (slices 1 to 3).                     |
| BUG-5 | [SCRUM-438](https://comp7082-eternalus.atlassian.net/browse/SCRUM-438) | Bound key actions do nothing                             | client / input | Open      | Open outside any plan: zoom `=`/`-` (in flight: PR #101). Sprint: only the Sentinel's Wrecking Run uses it (class passives, Phase 4 sprint 4.1); no other class has a sprint design. Scheduled: interact (FR-054, Phase 4 sprint 4.6, MVP cut 2), turret actions (Phase 2 sprint 2.3, MVP cut 3, DEC-07), minimap M (DEC-147, Phase 5 sprint 5.4; in flight: PR #101), perf overlay (Phase 5), F1 (BUG-4). |
| BUG-6 | [SCRUM-439](https://comp7082-eternalus.atlassian.net/browse/SCRUM-439) | A dead Legend never respawns, so the match stalls        | core           | Scheduled | Scheduled: GL-12 (DEC-80, FR-051); in flight: PR #100 (`fix/legend-respawn`). A dead Legend's XP is dropped until GL-12: structure XP (DEC-186, Phase 4 plan), kill XP (`TODO` in `ProgressionSystem.ts`, SCRUM-178).                                                                                                                                                                                      |
| BUG-7 | [SCRUM-440](https://comp7082-eternalus.atlassian.net/browse/SCRUM-440) | Structures draw no health bar of their own               | client / views | Scheduled | Deferred to the structure-views task, Phase 2 sprint 2.8 (DEC-195 (4)). Structures do have health; the Stronghold palace and gates keep their own (DEC-217).                                                                                                                                                                                                                                               |
