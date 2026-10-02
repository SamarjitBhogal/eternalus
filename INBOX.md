# INBOX — product owner ⇄ agent queue

**Protocol.** Sam (product owner + lead architect) writes requests, feedback and decisions in
this file, then says **"file updated"** in chat. The agent reads this file and treats the open
items as its prompt, in order. An item may be removed **only** after the agent has implemented
it and confirmed it is done; it then moves to _Done_ with the date and the commit/PR. Items the
agent cannot finish stay open with a note. Every session starts by reading this file
(`scripts/hooks/session-start.mjs` reports the number of open items).

Format: one checkbox per item. Put decisions under "Decisions", tasks under "Requests",
review comments under "Feedback".

## Decisions needed from Sam

Answering these unblocks Phase 1. Recommended picks are marked; reply inline
(`Decision: …`) or tick the box and write the answer under it.

- [ ] **DEC-01 Term end date and demo date.** The plan assumes ~10 working weeks from
      2026-10-05 (`docs/plan/README.md`). Give the real dates so sprints can be re-cut.
- [ ] **DEC-02 Confirm React/Redux with the instructor.** Decided D2 (keep), but the course rule
      "only JS/HTML/CSS" should be confirmed in writing. If refused: fallback is a vanilla DOM UI
      layer behind the same bridge (only `apps/client/src/ui/` changes).
- [ ] **DEC-03 Team-as-property (D10).** The requirements doc's tree has a "neutral entity"
      branch; the architecture models team as a component and camps/bosses as `Structure`/`Boss`
      with `team: 'neutral'` because revives and ascension change a unit's team. Accept, or insist
      on a `NeutralEntity` base class? (Recommended: accept.)
- [ ] **DEC-04 `feat/map` reconciliation.** Aryan's branch hardcodes Map 1 coordinates. Proposal:
      merge it as an authored _preset_ behind `MapGenerator`, or ask for it to be reworked into
      the generator before merge? (`docs/architecture/06-map-and-minimap.md` "review notes";
      recommended: merge types now, replace `MAP_1` data with generator output in Phase 1.3.)
- [ ] **DEC-05 Sprint length and phase reviewers.** Proposal: 1-week sprints; each phase PR
      reviewed by a different teammate (rotation in `docs/plan/README.md`). Name the reviewers.
- [ ] **DEC-06 World scale.** Proposal: 1 world unit = 1 metre; Legend radii from the size notes
      (Assault ≈ 1.1 m, Magus ≈ 1.5 m, Sentinel ≈ 2.3 m). Accept or give numbers.
- [ ] **DEC-07 MVP cut line.** `docs/plan/README.md` defines MVP-core vs MVP-full and the cut
      order (corner camps → manual turret control → pick-up/throw → art polish). Confirm the order.
- [ ] **DEC-08 Naming picks.** `docs/reference/suggestions/naming.md` proposes names for every
      placeholder (Assault, Flying, Enchantment, horde, buff tower, spawner tower, profile screen,
      Studious, Death Ray, Fury's god, the bow…). Pick or defer; picks go into content as display
      names, so nothing in code waits on them.
- [ ] **DEC-09 Discrepancy resolutions.** `docs/reference/suggestions/discrepancies.md` lists the
      open conflicts between the two source docs (which towers spawn what, camps "from the start"
      vs "after cooldown", capture-point checkpoints vs zones). Decide the ones marked _open_.
- [ ] **DEC-10 INBOX visibility.** This file is committed (teammates can see the queue). If you
      prefer it private, say so and it moves to a gitignored `INBOX.local.md`.

## Requests for the agent

- [ ] _(example)_ Phase 1, sprint 1.1: implement `SeededRandom` + `StateHasher` with tests
      per `docs/plan/phase-1-simulation-kernel-and-world.md`.

## Feedback

- [ ] _(none yet)_

## Done

- 2026-09-30 — Phase 0 documentation + harness written on `docs/phase-0-foundation`
  (see `docs/changelog/2026-09-30-phase-0-foundation.md`).
