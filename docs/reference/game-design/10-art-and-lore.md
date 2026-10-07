---
title: Art and lore
description: The art theme and its references, the MVP art level, the Light and Dark palettes and styles, the lore bullets and faction table, and the naming placeholders; read it before choosing assets, palettes or in-fiction names.
audience: [humans, agents]
status: active
owner: sholtzman
last-reviewed: 2026-09-30
tags: [reference, game-design, art, lore, naming]
related:
  - 'docs/reference/suggestions/naming.md'
  - 'docs/reference/game-design/12-open-questions.md'
  - 'docs/architecture/14-persistence-and-resources.md'
---

# Art and lore

**Purpose.** Read this when you pick or make an asset, choose a colour, write flavour text or
need an in-fiction name. It is short because the sources are short: the vision is a grand dark
fantasy, the MVP is low-poly or pixel art, and most names are still placeholders.

## Art theme

**Grand, dark fantasy**: the Remnant 2, Battle for Middle-earth, Elden Ring and Lords of the
Fallen aesthetic (game doc).

| Item                                                           | Status                                                                       |
| -------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| Low-poly or pixel art in-game                                  | **MVP** (game doc "MVP decisions so far")                                    |
| High-quality character art on the selection screen             | **post-MVP** (`[STATUS: needs-planning]`, yellow in the game doc)            |
| Map-wide atmosphere change when the central boss spawns        | **MVP-if-time** with the boss (`04-objectives-capture-points-and-bosses.md`) |
| Map starts green and grassy; grass and trees burn              | **MVP-if-time** (`05-map.md`)                                                |
| Legends grow in size and stature as an Eternal; new animations | **MVP-if-time** with the boss                                                |

Constraint from `AGENTS.md`: never add copyrighted assets the team has no licence for. The
reference games are mood references only. Assets go through the `ResourceController` and an
asset manifest (`../../architecture/14-persistence-and-resources.md`); nothing is loaded ad hoc.

## Team palettes and styles

| Team                 | Palette            | Style                                            | Status                                     |
| -------------------- | ------------------ | ------------------------------------------------ | ------------------------------------------ |
| Light (unique skins) | Gold, white, blue  | Paladin armour in gold and white                 | palette **MVP**; unique skins **post-MVP** |
| Dark (unique skins)  | Red, black, purple | Same classes, with hellish lava and rock styling | palette **MVP**; unique skins **post-MVP** |

The same three classes exist on both teams; the team changes the skin, not the kit. "Per-class
skin selection" is a loadout slot (`08-loadout.md`). Team colours are also the HUD and minimap
colours for `light` and `dark`; `neutral` needs a third (`Recommendation:` grey-green, matching
the corner-camp "purple" rifts only for terrain).

## Lore

From the game doc, verbatim in spirit:

- No faction is innocent.
- The factions used to live in a strained but organized peace? _(the source's own question mark)_
- A mysterious force or group broke the realm's order, and neither side could agree on how the
  land should be ruled or divided.

| Faction | Character                                                                 | Status                                          |
| ------- | ------------------------------------------------------------------------- | ----------------------------------------------- |
| Light   | Favoured order and a heavy hand; grandiose architecture; holier-than-thou | **MVP** (team)                                  |
| Dark    | Favoured order and a heavy hand; grandiose architecture                   | **MVP** (team)                                  |
| Medium  | Favoured chaos and self-rule                                              | `[STATUS: idea-pending]`; not a team in the MVP |

Open question (teal): **lore names a third "Medium" faction, but the art theme covers only Light
and Dark.** Two readings: a third playable team later (the game doc's "multi-team coordinated
attack" on the central boss hints at it), or the neutral camps and bosses as the "Medium"
faction's remnants (chaos and self-rule fits fortified corner camps with their own bosses). The
model already has `team = 'neutral'`; `Recommendation:` treat "Medium" as the in-fiction name for
neutral units until the question is decided, and keep `Team` a string-literal union so a third
playable team is one more literal plus content.

Note the Light and Dark descriptions are nearly identical in the source ("favoured order and a
heavy hand; grandiose architecture"); only "holier-than-thou" distinguishes Light. That is
probably unfinished text rather than intent; recorded in `../suggestions/discrepancies.md`.

## Naming placeholders

Names marked (rename pending), (working title), (name pending) or (TBD) in the sources are
placeholders. The code name is stable; the display name lives in content, so renaming never
touches logic. The full list, with proposals, is in `../suggestions/naming.md`; the to-dos are
tracked in `12-open-questions.md`.

| Placeholder                                                | Kind                                        | Status                                            |
| ---------------------------------------------------------- | ------------------------------------------- | ------------------------------------------------- |
| Warrior (formerly Assault)                                 | Class                                       | open                                              |
| Flying (rename pending) / "arial"                          | Class (post-MVP)                            | open (`[STATUS: idea-pending]`)                   |
| All sub-class names                                        | Sub-classes (post-MVP)                      | open                                              |
| Enchantment (rename pending)                               | Form change (post-MVP)                      | open                                              |
| Titan                                                      | Central boss                                | **removed**; replaced by Eternal (rename pending) |
| Eternal (rename pending)                                   | Central boss and the final-hit form         | open (the same word is used for both)             |
| Studious (name pending)                                    | Magus passive                               | open                                              |
| Death Ray (working title)                                  | Magus ultimate                              | open                                              |
| The bow (unnamed)                                          | Named weapon                                | open                                              |
| Second Sentinel artifact (TBD)                             | Artifact                                    | open                                              |
| Soul Orb (pending); Cast Forward, Follower (names pending) | Magus artifact and modes                    | open                                              |
| [god name] invoked by Fury                                 | Lore                                        | open                                              |
| "Hoard"                                                    | Group of minions                            | **horde** in our docs; better name wanted         |
| Buff/Debuff tower                                          | Structure ("need a themed name")            | open (`BuffTower` is the code name)               |
| Profile                                                    | Menu section ("better, themed name needed") | open                                              |
| "Blessings"                                                | Ability upgrades                            | open (`[STATUS: idea-pending]`)                   |

## Engineering notes

- Display names, palettes and skin references are content (`packages/core/src/content/` for
  names and IDs; the asset manifest for files). Renaming anything is a content edit; renaming a
  class is a class rename plus imports (requirements doc), never a search-and-replace across
  systems.
- Team colours are tokens in `apps/client/src/styles/global.css` and a `TeamPalette` lookup used
  by the views and the minimap, keyed by the `Team` literal, so a third team is one more entry.

## Related

- [Suggestions: naming](../suggestions/naming.md)
- [Suggestions: discrepancies](../suggestions/discrepancies.md)
- [Open questions](12-open-questions.md)
- [Loadout (skins)](08-loadout.md)
- [Map (terrain look)](05-map.md)
- [Architecture: persistence and resources (assets)](../../architecture/14-persistence-and-resources.md)
- [Verbatim source: Art Theme, Lore](../source/game-project-eternalus-v2.md)
