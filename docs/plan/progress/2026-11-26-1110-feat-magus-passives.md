---
title: 'Progress 2026-11-26: feat/magus-passives (DEC-337 (4) B, HC-B40 signed off, HC-B51)'
description: 'Phase 4 / sprint 4.1, sholtzman + Claude Code: the owner answered DEC-337 (4) with B (Erudition stretches the stagger and the knock-up of a knock-back too) and signed off HC-B40 (DEC-361); KnockbackEffect stretches both statuses, the push keeps its travel time; the critic fixes and HC-B51 (CastContext.applyStatus).'
audience: [humans, agents]
status: active
owner: sholtzman
last-reviewed: 2026-11-26
tags: [plan, progress, log]
---

# Progress 2026-11-26: feat/magus-passives (DEC-337 (4) B, HC-B40 signed off, HC-B51)

Phase 4 / sprint 4.1 · feat/magus-passives (on `5bae2a29`: `5d8eb071` and the critic-fix commit
after it) · sholtzman + Claude Code (eternalus-156, eternalus-157, eternalus-158)

- What was done: the owner answered two cards on the Owner Calls page (v98).
  - DEC-337 (4): "B: stretch them by 20% too". `KnockbackEffect` now applies `staggered` and
    `knockup` for the cast's stretched time, as the `debuff` step does. The push keeps its travel
    time. `onHit` knock-backs still read stretch 1.
  - HC-B40: "A: sign off all seven (built)". The DEC-361 row records the sign-off. Item (3)
    stays a follow-up, so the `INBOX.md` item stays open only for (3).
- Critic (`architecture-reviewer`, round 1 of this delta, on `5bae2a29..5d8eb071`,
  `eternalus-agent-work/magus-passives/critic-dec337-4b-r1.md`): PASS WITH NITS. Fixed:
  - S1: a `HitEffects.test.ts` case proves that an `onHit` knock-back's stagger keeps its time
    for an Erudition holder. Nothing tested `stretch: 1` before.
  - S2: HC-B40 stays open for its item (3) (INBOX protocol: an unfinished item stays open).
  - N1: the 05 §18 bullet is reflowed. N2: the decisions log's `last-reviewed` is bumped. N3:
    this entry is reworded.
  - N4 (no code change): `feat/sentinel-kit-room` changes the same knock-back loop. The
    coordinator tells lane B when #166 merges.
  - B1, better than the design, built under DEC-223 and sent for sign-off as HC-B51:
    `CastContext.applyStatus(targetId, step)` replaces `statuses` and `statusDuration` on the
    context. It credits the caster and stretches the time, so no step can miss the stretch. The
    buff, debuff and knock-back steps call it. The tests that read `statusDuration` now read the
    applied status. 05 §18 records it as built, waiting for the sign-off.
- `/ponytail-review` on `5bae2a29..5d8eb071`: "Lean already. Ship."
- Critic round 2 (on the critic fixes and HC-B51, `critic-hc-b51-r2.md`): PASS WITH NITS. It
  found no behaviour change and no weakened test. Its own mutations failed 7 tests (stretch twice)
  and 3 tests (credit the target). Its five nits:
  - N1: PR #175 and PR #162 also change the debuff code. The HC-B51 item names them, and the
    coordinator tells their owners.
  - N2: the credit case put the status on the caster itself, so it could not tell the caster from
    the target. The `CastInstance.test.ts` cases now apply the status to a second body.
  - N3: the HC-B40 answer note says when (3) is built, not when the item closes.
  - N4: `/ponytail-review` on the critic-fix delta: "Lean already. Ship." (`ponytail-hc-b51-r2.md`).
  - N5, not done: HC-B51 shares its commit with the round-1 fixes. The only code file in that
    commit that is not HC-B51 is `HitEffects.test.ts`, so a B answer reverses the commit's other
    code files with one path-limited `git apply -R` and records the answer in the docs.
- Tests fail first. The new `KnockbackEffect.test.ts` case was red on the old effect ("expected
  9 to be 11"; `dec337-4b-red-first.log`). Breaks for the critic fixes (`hc-b51-breaks.log`), each
  restored and checked with `cmp`:
  - S1b, `HitEffects` reads the attacker's own `abilityDuration`: the new case fails ("expected
    11 to be 9"). The first try, a constant stretch of 1.2, stretched both attackers alike and
    stayed green, so it was the wrong break.
  - `applyStatus` credits no one: "credits the status it applies to the caster" fails.
  - `applyStatus` credits the target (round 2, after N2): the same case fails ("expected false
    to be true"). Before N2 this break stayed green in that case.
  - `applyStatus` drops the stretch: 3 tests fail (CastInstance "expected 90 to be 108",
    AbilitySystem "expected 90 to be 108", KnockbackEffect "expected 9 to be 11").
- Checks run: `npm run check` on `5d8eb071` (before the critic fixes): `exit=0`; core 355 files
  / 2307 tests, protocol 31, client 2202, server 85, "Documentation check passed."
  (`check-dec337-4b.log`). On the critic-fix tree (round 1): `exit=0`; core 355 files / 2309
  tests (coverage, all files: 99.14 statements, 93.16 branches, 99.4 functions, 99.24 lines),
  protocol 31, client 2202, server 85, "Checked 146 Markdown files under docs/. Documentation
  check passed." (`check-hc-b51.log`). On the round-2 tree, before this line was filled in:
  `exit=0`; core 355 files / 2309 tests (same coverage), protocol 31, client 2202, server 85,
  "Documentation check passed." (`check-hc-b51-r2.log`). Then `prettier --check` and
  `npm run docs:check` on the final entry.
- Logs are in the sibling folder `eternalus-agent-work/magus-passives/`.
- Next step: the push and a comment on PR #166. Sam answers the HC-B51 card (A keep, B undo).
