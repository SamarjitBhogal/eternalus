---
title: Interface and screen flow
description: The product owner's design for the MVP screens - home menu, start-match loading, character select with team assignment and countdowns, pre-launch reveal, match loading and the in-match HUD - plus the engineering reading of it; read this before building any screen or HUD element.
audience: [humans, agents]
status: active
owner: sholtzman
last-reviewed: 2026-10-03
tags: [reference, game-design, ui, hud, screens]
related:
  [
    'docs/architecture/13-game-interface.md',
    'docs/reference/game-design/11-mvp-scope.md',
    'docs/reference/game-design/13-owner-decisions-log.md',
  ]
---

# Interface and screen flow

**Purpose.** Read this before building a screen or HUD element. §1–§4 are the product owner's
design (2026-10-03, lightly edited); §5 is the engineering reading that
[`13-game-interface.md`](../../architecture/13-game-interface.md) implements. Reference
visuals the owner named: Smite 2's god-selection and match-loading screens; Battlefield 6 and
Destiny 2 HUDs. Those are **inspiration only**: no asset, logo or layout is copied.

## 1. Home screen (MVP; must be an easy change in the full game)

Options stacked on the **left** of the screen; a themed background fills the rest:

- **Start match**
- **Loadouts** — configure loadouts saved to the player's profile
- **Profile** (themed name pending; "Chronicle" is the working display name) — match history
  (match id, character scores), achievements/medals (achievements do not exist yet; must be an
  easy add)
- **Settings**
- **About / credits**

The full game has several match types; the MVP has exactly one, so "Start match" starts it
directly.

## 2. From "Start match" to the match

1. **Start-match loading screen** — a dynamic, themed background (image(s), slow motion,
   mood). Graphics are configurable and swappable as content, never hardcoded.
2. **Character / class selection** — once the background assets are loaded. The player picks a
   class and the sub-class they want (MVP: three classes; sub-class slots shown but post-MVP).
   The screen shows **which team you are on** (Light or Dark; **randomly assigned** in the MVP;
   matchmaking by skill/profile level is full-game). Allied Legends stand on **pedestals** with
   their loadout applied; background and pedestals follow the team (light architecture for
   Light, hellish architecture for Dark). A **60 s countdown** runs; if the player has not
   selected a character when it reaches 0, the match boot is **cancelled** and the player
   returns to the home screen.
3. **Pre-launch reveal (10 s)** — after the countdown the friendly team is shown on its
   pedestals for 10 seconds with a timer counting down into launch; the enemy team appears in
   the **top right**.
4. **Match loading screen** — stays until everything for the match is loaded. Both teams'
   characters are shown: friendly team on **top**, enemy team on the **bottom**.
5. **Match** — the game loads in and the HUD appears around the screen.

## 3. HUD

Battlefield 6 / Destiny 2 inspired. A basic placeholder for now; detailed design is in the
works. Name tags above characters; bots carry a special, non-spoofable icon before their name
(decision log, Naming).

## 4. Side notes from the owner

- Future match types are a full-game concern; keep the MVP flow free of a match-type picker but
  do not hardcode the single type (it is a content/config value).
- In-match settings must be reachable (pause overlay) and share the same settings model as the
  home-screen settings.

## 5. Engineering reading (implemented by `13-game-interface.md`)

| Owner's step        | `SessionPhase`     | Screen component           | Timer source                             | Data it needs (slices)                                     |
| ------------------- | ------------------ | -------------------------- | ---------------------------------------- | ---------------------------------------------------------- |
| Home screen         | `menu`             | `MainMenuScreen`           | —                                        | `profileSlice` (name), `settingsSlice`                     |
| Start-match loading | `loading`          | `LoadingScreen`            | asset progress (`loading-progress`)      | `loadingSlice`, `themeSlice` (background set from content) |
| Character select    | `character-select` | `CharacterSelectScreen`    | `SessionClock` (injected, fake in tests) | `matchSetupSlice` (team, roster, selection, countdown)     |
| Pre-launch reveal   | `pre-launch`       | `PreLaunchScreen`          | `SessionClock`                           | `matchSetupSlice`                                          |
| Match loading       | `match-loading`    | `MatchLoadingScreen`       | asset progress (`match` group)           | `loadingSlice`, `matchSetupSlice`                          |
| Match + HUD         | `match`            | `MatchScreen` + `ui/hud/*` | `GameLoop` via the bridge                | `matchSlice`, `hudSlice`, `diagnosticsSlice`               |
| Results             | `results`          | `ResultsScreen`            | —                                        | `matchSlice.result`                                        |

Rules that follow from the design:

- **Timers are session timers, not simulation ticks.** The 60 s and 10 s countdowns run in the
  `SessionController` through an injected `SessionClock` port (real: `performance.now` via the
  engine `Clock`; tests: a fake), so they are testable and never touch `packages/core`.
- **Team assignment is part of `MatchSetup`** (`playerTeam` drawn from the match seed's RNG
  stream so a replay reproduces it). The player is their team's Rover (decision log, DISC-51).
- **Rosters are data**: the nine allied bots and ten enemy bots are built from content
  definitions (class, specialisation placeholder, loadout) when the match setup is created, so
  the selection screens can render them before the simulation exists.
- **Cancel-on-timeout** is a transition `character-select → menu` with a reason, not an error.
- **Background sets** (loading screen images, pedestal architecture per team) are an asset
  manifest group per team with a content key, swapped by changing content.
- **The HUD is prop-driven** and reads only selectors; every control label goes through
  `<KeyGlyph action>`.

## Related

- [`../../architecture/13-game-interface.md`](../../architecture/13-game-interface.md)
- [11-mvp-scope.md](11-mvp-scope.md)
- [13-owner-decisions-log.md](13-owner-decisions-log.md)
- [`../../plan/README.md`](../../plan/README.md)
