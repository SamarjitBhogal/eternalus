---
title: 'Progress 2026-11-22: feat/zealot-weapon-swap (PR 9 critic rounds 2 and 3, artifact catalogue)'
description: 'Phase 4 / sprint 4.2, sholtzman + Claude Code: PR 9 critic r2 fixes (artifactCatalogue.ts, equip test E7, owner cards HC-Q84..Q86, HC-B34), critic r3 approve with 0 blockers and its N1-N7; ponytail 0 cuts; breaks red; full check passed.'
audience: [humans, agents]
status: active
owner: sholtzman
last-reviewed: 2026-11-22
tags: [plan, progress, log]
---

# Progress 2026-11-22: feat/zealot-weapon-swap (PR 9 critic rounds 2 and 3, artifact catalogue)

Phase 4 / sprint 4.2 · feat/zealot-weapon-swap · sholtzman + Claude Code (PR-38-HELPER-48, -49)

- What was done: the critic round 2 and round 3 findings of combat PR 9 (DEC-303).
  `6742465b` (`feat/combat-equip`): the test "uses the new attacks for later target changes"
  (critic r2 F2); `290a8f13` merges it. `64bab47b`: `content/artifacts/artifactCatalogue.ts`
  lists the artifacts and `abilityCatalogue.ts` spreads that list in (17 R10, critic r2 F3);
  F4, F6 and F7 fixes; `Loadout` TSDoc. `8010630b`: `INBOX.md` HC-Q84 rewritten, HC-Q85,
  HC-Q86 and HC-B34 added, HC-B30 withdrawn; the 05 §18 note. Critic r3 (this session): owner
  card wording N1 (the talons hit more surely than an arrow), N2 (HC-Q84 options were
  re-lettered), N4, N5 (plain language first); N6 (`SecondaryWeaponRule.SWAP_WEAPON_KIND` is
  typed `SwapWeaponSpec['kind']`); N7 (test: every gadget in `ABILITIES` comes from
  `ARTIFACTS`). Rejected: critic r2 F11 (comment lines over 100 columns; Prettier does not wrap
  comments, and 112 core files at the base have such lines). Ponytail review: 0 cuts applied;
  the 3 cuts and 3 design items were rejected with reasons
  (`eternalus-agent-work/dec-288/pr9-ponytail-review.md`).
- Checks run: deliberate breaks, each restored, each turned its check red: E7 (one `Combat.ts`
  line; `combat-equip-breaks-e7.log`), N7a (a gadget listed in `ABILITIES` and not in
  `ARTIFACTS`) and N6 (the rule's kind renamed; `tsc` error TS2322) in `pr9-breaks-r3.log`.
  `npm run check` → `CHECK EXIT 0` on `8010630b`: core 353 files / 2218 tests, protocol 1 / 31,
  client 314 / 2208, server 21 / 85, "Documentation check passed." (`pr9-check-4.log`). Critic
  r3 on `8010630b`: approve, 0 blockers (`pr9-critic-r3.md`). The N1-N7 commit gets its own full
  check before the PR opens.
- Next step: open the PR (base `feat/ranged-attacks` until #148 merges). When PR 2
  (`feat/melee-sweeps`) is pushed, merge it (merge, not rebase) and, in that merge (critic r2
  F8, DEC-305): keep PR 2's private `cooldownTicks` and `beginAttack` body and PR 9's `equip`;
  `Legend.heldWeapon` passes `meleeReach` for both weapons; `equip` keeps the aim point (it does
  not reset `aimPointValue`, `lastSwingValue`, `hitIdsValue`, `hitAtTickValue` or
  `hitsUntilTickValue`); add the test "equip keeps the aim point" and a swap-back test. DEC row
  once the owner's HC-Q80..HC-Q86 and HC-B34 answers are final.
