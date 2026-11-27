---
title: 'Progress 2026-11-27: feat/damage-numbers (W5 damage numbers, DEC-410)'
description: 'Phase 3 / sprint 3, sholtzman + Claude Code: damage numbers as Roman badges (W5a to W5c), the persisted "show every hit" setting, DEC-410.'
audience: [humans, agents]
status: active
owner: sholtzman
last-reviewed: 2026-11-27
tags: [plan, progress, log]
---

# Progress 2026-11-27: feat/damage-numbers (W5 damage numbers, DEC-410)

Phase 3 / sprint 3 · feat/damage-numbers (from `phase/3-sprint-3-work` f801af9a) · sholtzman + Claude Code

- What was done: Owner Calls v103 W5a to W5c (DEC-410). `DamageBadges` hears `damage-applied` and
  keeps the badges (the player's hits dealt and taken by default; steel for the shielded part;
  drop and flame for bleed and burn ticks; big hits; up to 4 side by side). `DamageBadgeLayer`
  draws them through the new `Renderer.drawText`, with pop, fade, drip and flicker, and no motion
  under Reduce motion. A persisted `hud` settings group holds "Damage numbers for every hit"
  (Video tab). Docs 08, 13 and 14 and the decisions log updated. 46 deliberate breaks all turned
  the tests red (`eternalus-agent-work/abilities/pr3-weapons/damage-numbers-breaks.log`).
- Checks run: the first `npm run check` (08:46Z) ended `EXIT 1`: two teardown inventories
  (`Match.lifecycle.test.ts`, `SessionController.endToEnd.test.ts`) did not list the new
  `damage-applied` listener. Both now list it, and `Match.destroy` drops it after the Legend bodies'
  one (construction order); break B46 turned both red. The second `npm run check` (08:58Z to
  09:07Z): `EXIT 0`. Tests: core 1918 passed, protocol 31 passed, client 2303 passed, server 163
  passed; build passed; "Documentation check passed." (210 files).
- Next step: the pre-PR gate (critic, ponytail, re-check), then the coordinator runs the push
  script and opens the PR into `phase/3-sprint-3-work`. Owner: Sam (the Video-tab placement is a
  UX call flagged in the PR body).
- Appended 2026-11-27 (DAMAGE-NUMBERS-4): critic round 1 passed with findings and no blockers.
  Fixed: C1 and C2 (`MatchDeps.isReducedMotion` reads the Reduce motion setting or the system's
  `prefers-reduced-motion`, through the factories' shared `matchSettingReaders`), C3 (docs: an
  online Duel shows no damage numbers), C4 (shared `views/damageBadge.types.ts` and
  `.constants.ts`), C5 (a big hit counts the shielded part, and both its badges are big), C6, C9,
  C10, C12, C13. Not applied: C7 and C8 (reasons in the PR body); C11 is an Owner Calls card.
  Breaks B47 to B52 all turned the tests red. `npm run check` (09:40Z to 09:50Z): `EXIT 0`. Tests:
  core 1918 passed, protocol 31 passed, client 2308 passed, server 163 passed; build passed;
  "Documentation check passed."
