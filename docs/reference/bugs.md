---
title: Bug tracker
description: The overview of known bugs in Eternalus, one row per bug linked to its Jira issue under the Bugs epic (SCRUM-433); read this before picking up a bug fix or to see what is broken right now.
audience: [humans, agents]
status: active
owner: SamarjitBhogal
last-reviewed: 2026-11-09
tags: [reference, bugs, jira]
related: ['docs/plan/PROGRESS.md', 'docs/reference/README.md']
---

# Bug tracker

## Overview

Jira is the source of truth for each bug: its details, steps to reproduce, assignee and history.
This page gives the short overview so you can see everything that is open at a glance.

- **Epic:** [SCRUM-433 – Epic 11 – Bugs](https://comp7082-eternalus.atlassian.net/browse/SCRUM-433)
- **Board:** [SCRUM backlog](https://comp7082-eternalus.atlassian.net/jira/software/projects/SCRUM/boards/1/backlog)

## How to add a bug

1. Create a **Task** in Jira project SCRUM. Set its parent to SCRUM-433 and add the label `bug`.
   The project has no Bug issue type.
2. Add a row to the table below. Use the next `BUG-n` ID and link the Jira key.
3. Once the bug is fixed, set the status to `Fixed` and put the PR in Notes. Keep the row: the
   table is the history of bugs.

Status values: `Open`, `In progress`, `Fixed`, `Won't fix`.

## Bugs

| ID    | Jira                                                                   | Title                                                    | Area           | Status    | Notes                                                                                                          |
| ----- | ---------------------------------------------------------------------- | -------------------------------------------------------- | -------------- | --------- | -------------------------------------------------------------------------------------------------------------- |
| BUG-1 | [SCRUM-434](https://comp7082-eternalus.atlassian.net/browse/SCRUM-434) | Units show no health bar, so attacks look like they miss | client / views | Open      | Map objects have bars; minions, mobs, Legends and dummies draw none. Health is already in the snapshot.        |
| BUG-2 | [SCRUM-435](https://comp7082-eternalus.atlassian.net/browse/SCRUM-435) | Interior walls use wall-segment health (2,000 HP)        | core / content | Open      | Reported as "player attack is weak". Attack numbers match the spec; interior walls use the palace wall value.  |
| BUG-3 | [SCRUM-436](https://comp7082-eternalus.atlassian.net/browse/SCRUM-436) | Minions do not attack obstacles or props                 | core / ai      | Open      | Design change request, not a defect: minions path around obstacles (DEC-193). Needs a product-owner decision.  |
| BUG-4 | [SCRUM-437](https://comp7082-eternalus.atlassian.net/browse/SCRUM-437) | Developer menu not implemented (FR-096 to FR-099)        | client         | Open      | Free camera (Ctrl+Shift+F3) and wheel zoom work. Teleport is in no requirement: raise it as a feature request. |
| BUG-5 | [SCRUM-438](https://comp7082-eternalus.atlassian.net/browse/SCRUM-438) | Bound key actions do nothing                             | client / input | Open      | Zoom `=`/`-`, minimap M, perf overlay, developer menu, sprint, interact, turret actions.                       |
| BUG-6 | [SCRUM-439](https://comp7082-eternalus.atlassian.net/browse/SCRUM-439) | A dead Legend never respawns, so the match stalls        | core           | Open      | FR-051; kill XP for a dead Legend is dropped too. Relates to SCRUM-178.                                        |
| BUG-7 | [SCRUM-440](https://comp7082-eternalus.atlassian.net/browse/SCRUM-440) | Structures draw no health bar of their own               | client / views | Won't fix | Owner: structures do not have health; the entities that build them do.                                         |
