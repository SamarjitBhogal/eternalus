---
title: 'Progress 2026-11-25: feat/developer-menu-sim-mode'
description: 'Phase 3 / sprint 3, claudiodh + Claude Code: PR #112 review items (2) and (4), the TSDoc nit, and a merge of phase/3.'
audience: [humans, agents]
status: active
owner: claudiodh
last-reviewed: 2026-11-25
tags: [plan, progress, log]
---

# Progress 2026-11-25: feat/developer-menu-sim-mode

Phase 3 / sprint 3 · feat/developer-menu-sim-mode (PR #112) · claudiodh + Claude Code

- What was done: merged `phase/3-sprint-3-work`. Item (2): a Legend the human leaves (Remove human,
  or a seat move) becomes the bot its team lacks, the Rover if the team has no Rover bot, otherwise a
  `bot-legend` laner on the free lane (`assignLanes` with `occupied`); the chooser is
  `state/missingRoleChooser.ts`, injected into `DevSetControllerHandler` by `Simulation`
  (`Simulation.constants.ts` holds the Rover spawn). Item (4): with no human, sim mode's Follow and
  Stop following send the client-only `dev-follow` intent; `DeveloperMenuController` keeps the
  followed Legend and `Match` points the camera at it. Fixed the stray comma in
  `DevSetControllerHandler`'s TSDoc. Docs 03, 11 and 13 status notes updated. The merge left `Simulation.capture.test.ts` (DEC-261) expecting no dark
  Legend after 30 s; with this branch's respawn queue (FR-051) they come back at their Stronghold,
  so the test now checks that. Item (1) waits for
  the owner; DEC-356 is not recorded yet.
- Checks run: `npm run check:quick`, `npm run docs:check`, vitest on the touched core and client
  files (results in the PR thread).
- Next step: swholtzman re-reviews PR #112; the owner answers item (1), then DEC-356 is recorded.
