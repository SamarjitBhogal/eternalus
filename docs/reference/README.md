---
title: Reference
description: Index of the reference folder (the game-design vision split by topic, the glossary, the suggestions and the verbatim sources) with the reading order and the rules for using these docs; read it first when you need to know what the game is rather than how the code is built.
audience: [humans, agents]
status: active
owner: sholtzman
last-reviewed: 2026-10-06
tags: [reference, index, game-design]
related:
  - 'docs/README.md'
  - 'docs/reference/game-design/00-overview-and-status-legend.md'
  - 'docs/requirements/06-mvp-requirements.md'
  - 'docs/architecture/README.md'
---

# Reference

**Purpose.** Read this when you need to know what Eternalus **is** (the design the product owner wrote down, split by topic and tagged with MVP status), what a word means, or what the engineering side has proposed but nobody has decided yet. The reference folder is the vision; `../requirements/06-mvp-requirements.md` decides what the MVP builds, `../plan/` decides when, and `../architecture/` decides how. When this folder and the requirements catalogue disagree, the catalogue wins for scope and the disagreement goes into `game-design/12-open-questions.md`.

## Reading order

1. `game-design/00-overview-and-status-legend.md` — the elevator pitch and what **MVP**, **MVP-if-time**, **post-MVP**, **removed**, `idea-pending` and `needs-planning` mean. Nothing else in the folder makes sense without it.
2. `game-design/11-mvp-scope.md` — the yes/no on scope, line by line.
3. The topic you need (`game-design/01` to `10`): classes, units, structures, objectives, map, abilities, weapons, loadout, controls, art and lore. Each has an **Engineering notes** section naming the code and the single place of change.
4. `game-design/12-open-questions.md` — before you decide anything the sources left open. Agents never decide these; they add a row and ask.
5. `suggestions/` — the engineering side's proposals (names, numbers, mechanics, extra content, discrepancies). Proposals carry no authority until the owner accepts them (`suggestions/README.md`).
6. `glossary.md` whenever a word is unfamiliar, and `source/` when you need the original wording.

## Index

| Path                                                     | What it is                                                                                                                                                                                          |
| -------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `README.md`                                              | This index and the reading order.                                                                                                                                                                   |
| `glossary.md`                                            | Alphabetical one-line definitions of every game and engineering term, each with its canonical code name.                                                                                            |
| `game-design/00-overview-and-status-legend.md`           | What Eternalus is, how this folder is organised, the status legend and the precedence rule (brief decisions → requirements catalogue → game-doc highlights).                                        |
| `game-design/01-classes-and-subclasses.md`               | The four Legend classes (three in the MVP), post-MVP sub-classes, default actions, passives, pick-up interactives, character sizes and movement profiles.                                           |
| `game-design/02-entities-and-units.md`                   | Every unit kind: Legends, minions and hordes, guards, neutral camp units, bosses, the Rover; the entity stat set and the unit caps.                                                                 |
| `game-design/03-structures-and-defenses.md`              | SpawnerTower, BuffTower and Stronghold, what destroying each does, walls, gates, the buff-tower shield math, turrets, anti-air and the form-change hooks.                                           |
| `game-design/04-objectives-capture-points-and-bosses.md` | Scoring and the win condition, capture points and their three checkpoints, central zones, quarter-mark mini-bosses, the Eternal boss, corner camps and the match timeline.                          |
| `game-design/05-map.md`                                  | Map 1 as the vision describes it, the generated-map requirement (D7), the MVP layout, obstacles and destructible terrain, and the provisional `feat/map` data.                                      |
| `game-design/06-abilities-and-progression.md`            | The class abilities, combos, ultimates and charge rules, the no-item-shop progression, aether and XP-based scaling.                                                                                 |
| `game-design/07-weapons-and-artifacts.md`                | Weapon classes, the named and unique weapons, the class artifacts (gadgets) and the open question of weapon abilities.                                                                              |
| `game-design/08-loadout.md`                              | The loadout slots, pre-game configuration with auto-build, mid-game changes and persistence to the profile.                                                                                         |
| `game-design/09-controls.md`                             | Default bindings, the no-hard-coded-controls rule, press-to-bind settings, dynamic prompts, and the post-MVP controller and first-person modes.                                                     |
| `game-design/10-art-and-lore.md`                         | The art theme and references, the MVP art level, the Light and Dark palettes, the lore bullets and the naming placeholders.                                                                         |
| `game-design/11-mvp-scope.md`                            | The merged MVP list with every line tagged, the long-term goals, the boot-menu structure and the developer menu.                                                                                    |
| `game-design/12-open-questions.md`                       | Every open question and naming to-do (OQ-nn) with status, owner and decision columns.                                                                                                               |
| `game-design/13-owner-decisions-log.md`                  | Dated record of the product owner's decisions taken through `INBOX.md` and the docs each one changes; a decision here overrides the other reference docs.                                           |
| `game-design/14-interface-and-screen-flow.md`            | The product owner's design for the MVP screens, from the home menu to the in-match HUD, and the engineering reading of it.                                                                          |
| `suggestions/README.md`                                  | What a suggestion is, how the owner accepts or rejects one, and the index of the suggestion files.                                                                                                  |
| `suggestions/naming.md`                                  | Themed name proposals for every placeholder and the in-code naming convention that keeps renames cheap.                                                                                             |
| `suggestions/balancing.md`                               | Starting numbers, formulas and balance knobs for hordes, minions, structures, turrets, capture points, bosses, abilities, XP and the Eternal form, and how to test balance headlessly.              |
| `suggestions/more-abilities.md`                          | Additional abilities and an alternative ultimate per MVP class, post-MVP Flying and sub-class ideas, the `AbilityEffect` catalogue and the proposed status-effect table.                            |
| `suggestions/more-weapons.md`                            | Additional named weapons per weapon class, additional artifacts per class, the recommended MVP catalogue and a proposal for weapon "abilities" without active slots.                                |
| `suggestions/mechanics-ideas.md`                         | Minimal versions or cuts for open mechanics: form change, the summoner, pick-up/throw, the class-switch ultimate penalty, the Rover bot, sim mode, achievements, match history, the developer menu. |
| `suggestions/discrepancies.md`                           | Every discrepancy between the requirements doc, the game doc, the repo scaffold and the Phase 0 docs (DISC-nn) with a proposed resolution, and the list of decisions the owner still owes.          |
| `source/game-project-eternalus-v2.md`                    | Verbatim transcription of the game doc (Sep 18, 2026) with the PDF's highlight colours as `[STATUS: …]` tags.                                                                                       |

The requirements doc's transcription lives next door at `../requirements/source/requirements-of-architecture.md`; the reference docs quote it as "the requirements doc".

## Conventions in this folder

- Every item carries an MVP status (**MVP**, **MVP-if-time**, **post-MVP**, **removed**); every number quoted from a source carries `TUNE`; every invented value is labelled `Recommendation:`; placeholders keep their "(rename pending)" note. The full legend is in `game-design/00-overview-and-status-legend.md`.
- Spelling: **horde**, never "hoard"; **minion** in prose, `Mob` in code; **Stronghold**, **SpawnerTower**, **BuffTower**, **Legend**, **aether**. The glossary is canonical.
- Links are relative. Architecture docs are cited by their numbered path under `../architecture/`, research reports by path and section anchor under `../research/`.
- These docs describe the vision; reading a mechanic here does not put it in scope. Scope is `../requirements/06-mvp-requirements.md` and `game-design/11-mvp-scope.md`.

## Maintaining the folder

- A design decision is recorded once, in `game-design/12-open-questions.md` (or an ADR under `../decisions/` when it changes the architecture); the topic doc is then updated to state it as fact and the glossary follows.
- A new suggestion goes into the file that owns its topic; a new topic gets a new file and a row in `suggestions/README.md` and here.
- `source/` is never edited to "fix" the design; changes are recorded as decisions or suggestions.
- Every file has the frontmatter from the brief (§4); the docs step of `npm run check` validates it and the relative links.

## Related

- [Docs map](../README.md)
- [Overview and status legend](game-design/00-overview-and-status-legend.md)
- [MVP scope](game-design/11-mvp-scope.md)
- [Open questions](game-design/12-open-questions.md)
- [Suggestions](suggestions/README.md)
- [Glossary](glossary.md)
- [MVP requirements catalogue](../requirements/06-mvp-requirements.md)
- [Architecture index](../architecture/README.md)
- [Plan](../plan/README.md)
