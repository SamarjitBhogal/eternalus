---
title: Overview and status legend
description: What Eternalus is, how the game-design reference is organised, and what the status tags on every item mean; read it before any other game-design doc.
audience: [humans, agents]
status: active
owner: sholtzman
last-reviewed: 2026-09-30
tags: [reference, game-design, overview, status-legend]
related:
  - 'docs/reference/README.md'
  - 'docs/reference/source/game-project-eternalus-v2.md'
  - 'docs/requirements/06-mvp-requirements.md'
  - 'docs/plan/README.md'
---

# Overview and status legend

**Purpose.** Read this when you are about to use any doc under `docs/reference/game-design/` for
the first time, or when you are unsure whether a game feature you just read about is part of the
MVP. It gives the elevator pitch, explains the status tags used on every item, and states the one
rule that keeps the reference honest: these docs describe the **vision**; the requirements
catalogue says what the MVP **builds**; the plan says **when**.

## What Eternalus is

Eternalus is a team-based, class-driven objective game. Two teams, **Light** and **Dark**, each
field ten **Legends** (player characters) across a destructible three-lane map. They capture
points, destroy enemy structures and, ultimately, destroy the enemy **Stronghold** (the capital).
The product owner's shorthand: _Battle for Middle-earth meets League of Legends_.

The MVP is a top-down, lane-based, single-player match in the browser: one human Legend, every
other Legend and every unit a bot, no server. It runs on a custom Canvas 2D engine with React for
menus and HUD (decided; see `../../decisions/`, ADR 0004). The full game (first person, controller
support, a flying class, mounts, form change, an ability tree) is the long-term goal that the MVP
architecture must leave room for.

Key facts at a glance (all tuning values are quoted from the source docs and marked `TUNE`):

| Fact                | Value                                                                                                          | Source                     |
| ------------------- | -------------------------------------------------------------------------------------------------------------- | -------------------------- |
| Teams               | `light`, `dark`, plus `neutral` for camps and bosses                                                           | requirements doc, MVP list |
| Legends             | 10 per team (3 per lane + 1 Rover); MVP classes Assault (rename pending), Sentinel, Magus                      | game doc, requirements doc |
| Lane units          | Minions in hordes of 16 (light), 8 (medium), 4 (heavy) `TUNE`                                                  | requirements doc           |
| Structures per team | Stronghold with walls, gates and turrets; per lane 1 SpawnerTower and 1 BuffTower                              | requirements doc, game doc |
| Neutral             | 6 forest camps per side, 3 central capture points (middle one is the Cathedral), corner camps with mini-bosses | requirements doc, game doc |
| Match start         | 60 s countdown `TUNE`; only 3 hordes of 16 from each Stronghold; towers spawn every 60 s `TUNE` after          | requirements doc           |
| Resources           | Health, **aether** (mana), XP and level                                                                        | requirements doc           |
| Caps                | Max 10 Legends per team, max 144 units per team `TUNE` (engineered for hundreds)                               | requirements doc           |
| Win                 | Destroy the enemy Stronghold                                                                                   | game doc                   |

## The status legend

The game doc is a PDF whose coloured highlights mark the status of individual items. The
transcription in `../source/game-project-eternalus-v2.md` encodes them as `[STATUS: …]` tags.
The game-design docs go one step further and mark **every** item with an MVP status derived from
three inputs, in this order of precedence:

1. The writer brief's decisions (D1–D12; recorded as ADRs and in the plan backlog).
2. The requirements doc's MVP list (`../../requirements/06-mvp-requirements.md`).
3. The game doc's highlight colours.

| Marker in these docs | Meaning                                                                                        | Derived from                                                                                                         |
| -------------------- | ---------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| **MVP**              | The MVP builds it. It has (or will have) an FR- or NFR- entry in the requirements catalogue.   | Requirements MVP list; unhighlighted items the list depends on.                                                      |
| **MVP-if-time**      | Wanted in the MVP, built only if the schedule allows; the architecture must not block it.      | The game doc's "INCLUDED IN MVP IF POSSIBLE" section and items the requirements doc lists without a firm commitment. |
| **post-MVP**         | Deliberately outside the MVP; an extension point exists or is planned for it.                  | Orange highlight; the requirements doc's "Long term goal" list; brief decisions D11 and D12.                         |
| **removed**          | Determined to be removed. Kept in the docs so the history is visible; nothing is built for it. | Red highlight.                                                                                                       |

Two further tags from the PDF are kept because they change how an item is read:

| Tag                        | Highlight | How to treat it                                                                                                                                                  |
| -------------------------- | --------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `[STATUS: idea-pending]`   | Teal      | An idea the product owner has not committed to. Do not design against it; leave a hook if it is cheap.                                                           |
| `[STATUS: needs-planning]` | Yellow    | Potential removal or needs more planning before integration. Treat as **post-MVP** for scope; it stays in the open-questions table until a decision is recorded. |

Conventions used across the game-design docs:

- `TUNE` marks a number quoted from a source doc that is provisional. Numbers live in
  `packages/core/src/content/` when code exists, never in code paths.
- `N`, `X`, `N00%`, `Nx` are the source's own placeholders for values that were never set.
- `(rename pending)`, `(working title)`, `(name pending)`, `(TBD)` are placeholder names from the
  source and are kept verbatim. Display names live in content; class names are stable code names.
- `Recommendation:` labels a conservative suggestion the writers made where the sources are
  silent. A human accepts or rejects it; until then it is not a decision.
- Spelling follows the sources except **horde** (the sources write "hoard").

## How the reference folder is organised

```text
docs/reference/
  README.md                       index of this folder and the reading order
  glossary.md                     every game and engineering term, one line each, with code names
  game-design/                    the vision, split by topic (this folder)
    00-overview-and-status-legend.md
    01-classes-and-subclasses.md
    02-entities-and-units.md
    03-structures-and-defenses.md
    04-objectives-capture-points-and-bosses.md
    05-map.md
    06-abilities-and-progression.md
    07-weapons-and-artifacts.md
    08-loadout.md
    09-controls.md
    10-art-and-lore.md
    11-mvp-scope.md
    12-open-questions.md
  suggestions/                    proposals, not decisions: balancing, naming, more abilities, more weapons,
                                  mechanics ideas, discrepancies between the sources
  source/
    game-project-eternalus-v2.md  verbatim transcription of the game doc with [STATUS] tags
```

Each game-design doc follows the same shape: Purpose, the design as the sources describe it
(tables for catalogues, prose for rules), an **Engineering notes** section that names the
canonical code names and the single place of change for that topic, and a Related list.

## Vision, scope and schedule are three different documents

- **Vision** — `docs/reference/game-design/` (these docs) and the verbatim source. They describe
  the whole game, including post-MVP and removed ideas, so the architecture can leave the right
  extension points. Reading a mechanic here does not mean it is being built.
- **Scope** — `../../requirements/06-mvp-requirements.md`. The FR-/NFR- catalogue is the only
  place that says what the MVP builds. When this reference and the catalogue disagree, the
  catalogue wins for scope and the disagreement goes into `12-open-questions.md`.
- **Schedule** — `../../plan/`. The phase docs say when each requirement is built and how it is
  verified. Post-MVP items are in `../../plan/backlog-post-mvp.md`.

Agents: never make a product or game-design decision from these docs. If a doc is ambiguous,
look for the item in `12-open-questions.md`; if it is not there, add it with a blank decision and
ask a human.

## Engineering notes

- Every design item here maps to data in `packages/core/src/content/` (Type Object definitions
  keyed by kebab-case ID) and, where behaviour is unique, to one class. The product owner's
  litmus test for the architecture is: "new idea? add a new class (and a content entry, and a
  registry line) — nothing else changes". The game-design docs name the class and the content
  folder for each item so that test can be applied.
- The canonical vocabulary (Legend, horde, SpawnerTower, BuffTower, Stronghold, aether, …) is in
  `../glossary.md`. Use those names in code, docs and commit messages.

## Related

- [Reference index](../README.md)
- [Glossary](../glossary.md)
- [Verbatim game doc](../source/game-project-eternalus-v2.md)
- [Open questions](12-open-questions.md)
- [MVP scope](11-mvp-scope.md)
- [MVP requirements catalogue](../../requirements/06-mvp-requirements.md)
- [Plan](../../plan/README.md)
- [Architecture: layered OOP model](../../architecture/01-layered-oop-model.md)
