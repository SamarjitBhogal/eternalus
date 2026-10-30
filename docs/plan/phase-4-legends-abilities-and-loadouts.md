---
title: Phase 4 — Legends, abilities and loadouts
description: Sprint checklists for the three Legend classes, the ability framework and MVP ability set, ultimates, weapons and artifacts, loadouts, XP progression and the ability HUD; read this before starting any Phase 4 task.
audience: [humans, agents]
status: draft
owner: sholtzman
last-reviewed: 2026-10-29
tags: [plan, phase-4, legends, abilities, loadouts, progression, hud]
paths:
  ['packages/core/src/abilities/**', 'packages/core/src/loadout/**', 'apps/client/src/ui/hud/**']
related:
  [
    'docs/plan/README.md',
    'docs/architecture/05-abilities-weapons-and-loadouts.md',
    'docs/reference/game-design/06-abilities-and-progression.md',
  ]
---

# Phase 4 — Legends, abilities and loadouts

## Purpose

Read this when you pick up a Phase 4 task or review the Phase 4 PR. Phase 4 replaces the
placeholder Legend with the MVP classes (`content/legends/`;
reference 01), adds the ability framework the requirements doc demands to be "extremely simple"
to extend (a new ability is one `AbilityEffect` strategy plus one content entry plus one
`AbilityRegistry` line), the MVP ability set and ultimates from the game doc, weapons and
artifacts as definitions, the `Loadout` model, XP-based scaling, and the HUD `AbilityBar` whose
key glyphs follow the player's bindings. The Flying class, sub-classes, form change and the
ability tree are **post-MVP** (D11, D12) and only get extension points here.

- **Branch:** `phase/4-legends-abilities-and-loadouts` (stacked on `phase/3-…` until it merges).
- **Weeks:** 7–8 (2026-11-16 → 2026-11-27). Week 7: sprints 4.1, 4.2, 4.7 (start); week 8:
  sprints 4.3, 4.4, 4.5, 4.6, 4.7 (finish).
- **Requirement areas served:** "FR: classes", "FR: XP scaling", "FR: loadouts", "FR: controls
  & rebinding" (dynamic prompts), "FR: Legends 10v10" (bots use abilities), "NFR: no
  hardcoding" (abilities, weapons and restrictions in content).
- **Depends on:** Phase 2 (`DamagePipeline`, `StatusEffectRuntime`), Phase 3
  (`BotLegendController` emitting `cast-ability`, `checkpoint-reached` and `camp-cleared` XP
  events). INBOX decisions needed by week 7: the third ability per class, one ultimate per
  class, the Warrior artifact.

## Sprint 4.1 — Legend family and class definitions

Owner: _ (sim lane A). Week 7. Follows [04-entity-architecture.md](../architecture/04-entity-architecture.md).

- [ ] **`Legend` abstract** (3 abilities + ultimate, 2 artifact slots, `Loadout`,
      `Progression`, aether) + **`Warrior`, `Sentinel`, `Magus` concrete** with
      `LegendDefinition` content; `harbinger` reserved as a content id with no class (DEC-59). Owner: _.
      Test: each class spawns with its components; the class chain depth is 3. Done when:
      renaming `Warrior` touches the class, its imports and one display name.
- [ ] **Sizes and movement profiles** (`TUNE`, game doc "Entity Class Specifics": Warrior ≈
      medium minion size, Magus ≈ heavy minion, Sentinel very large; Sentinel low base speed,
      highest `maxSpeed`, slow acceleration, up to 1 minute to full speed; Magus floats or walks
      as a `MovementStrategy` flag). Owner: _. Test: a Sentinel reaches `maxSpeed` after the
      content-defined number of ticks and then satisfies Phase 2's sprint-through rule. Done
      when: the sprint-through dummy flag from Phase 2 is replaced by the Sentinel definition.
- [ ] **Class passives as content** (`TUNE`: Sentinel "Wrecking Run", Magus "Studious" (name
      pending) and "Necromancy") applied through `StatusEffects`/modifiers. Owner: _. Test: each
      passive changes the documented stat. Done when: passives are entries, not subclasses.
- [ ] **`LegendSpecDefinition` extension point** (D11: sub-classes as data-driven
      specializations; MVP since ADR 0018: the specs ship as display and setup data, and the phase
      that builds their gameplay is open, `INBOX.md` HC-Q17). Owner: _. Test: an empty spec is
      accepted by validation.
      Done when: [17-extension-recipes.md](../architecture/17-extension-recipes.md) shows the
      recipe.

**Success metric:** three classes spawn from content and a fourth fake class in a test needs one
class, one content entry and one registry line.

## Sprint 4.2 — Ability framework

Owner: _ (sim lane B). Week 7. Follows
[05-abilities-weapons-and-loadouts.md](../architecture/05-abilities-weapons-and-loadouts.md).

- [ ] **`Abilities` component + `AbilityRuntime`** (cooldown ticks, aether cost, charges,
      cast state; aether regeneration per `Progression`). Owner: _. Test: casting on cooldown
      or without aether is refused with a typed reason; aether never goes negative. Done when:
      the runtime is class-agnostic.
- [ ] **`Ability` interface + `AbilityEffect` strategies + `AbilityRegistry`** (effects:
      `damage-area`, `dash`, `apply-status`, `buff-self`, `buff-allies`, `invisibility`,
      `knockback`, `summon`, `beam`; composable per ability definition). Owner: _. Test: a fake
      ability composed of two effects runs both in order; unknown effect id fails validation.
      Done when: a new ability is one effect class (if new), one content entry and one registry
      line.
- [ ] **`AbilitySystem`** (consumes `cast-ability` commands from human and bots; targeting
      through `TargetingStrategy`; emits `ability-cast`). Owner: _. Test: the same command from
      `PlayerController` and `BotLegendController` behaves identically. Done when: replay
      fixtures with abilities hash identically.
- [ ] **Restrictions as data** (per-ability: class allow-list, weapon requirement, zone or
      state conditions; per the requirements doc "adding restrictions … should be extremely
      simple"). Owner: _. Test: a restriction added in content blocks a cast with a reason. Done
      when: no restriction is code.

**Success metric:** the framework tests prove the litmus test — adding "Fake Bolt" in a test
touches three places — and abilities cost ≤ 0.5 ms per tick with 20 Legends casting
(`Recommendation:` budget).

## Sprint 4.3 — MVP ability set, ultimates and charge rules

Owner: _ (sim lane A + B). Week 8. Every ability below is `TUNE` from the game doc's Abilities
and Ultimate Abilities tables; N/X values are content placeholders until balance (Phase 6).

- [ ] **Warrior**: `Veil` (invisible for N s), `Blade Runner` (dash; varieties Physical:
      knockback in path + stun at the end / Magical: flame trail + burn at the end, loadout
      configurable); third ability per INBOX. Ultimate `Fury` (over-max attack speed for N s,
      dash on press, N× damage, knockback). Owner: _. Test: one scenario test per ability and
      variety. Done when: each is content + registered effects.
- [ ] **Sentinel**: `Slam` (ground shockwave, knockback + knockup, damages nearby ground and
      structures through the Phase 2 pipeline), `Rip & Tear` (description pending in INBOX);
      third per INBOX. Ultimate: one of `Berserk` or `Meteor Fall` per INBOX (the other stays
      content for post-MVP). Owner: _. Test: `Slam` destroys a breakable obstacle and knocks
      units back in ID order. Done when: scenario tests pass.
- [ ] **Magus**: `Imbue` (weapon damage +X%, attack speed +N%; varieties Damage: self / Support:
      lesser buff to allies), `Shockwave` (knockback + `concussion`); third per INBOX. Ultimate:
      one of `Death Ray` (working title; long beam for N s) or `Nova` per INBOX. Owner: _. Test:
      scenario tests including the Support variety buffing allies only. Done when: scenario
      tests pass.
- [ ] **Ultimate charge rules** (`TUNE`: kills, assists and objective damage fill the meter; no
      passive fill; lose N% on death). Class switching mid-match and its cooldown penalty are
      **MVP-if-time**. Owner: _. Test: the meter fills only from the listed events. Done when:
      the fill table is content.
- [ ] **Interactions (MVP-if-time, `Recommendation:` skip unless slack)**: `Slam` + `Shockwave`
      explosion; opposing `Death Ray` lock. Owner: _. Test: only if implemented. Done when:
      documented as an `AbilityEffect` recipe either way.

**Success metric:** 100% of MVP abilities and ultimates have a passing scenario test that
asserts the documented effect, and the product owner signs off each ability's feel in the
browser.

## Sprint 4.4 — Weapons, artifacts and attack strategies

Owner: _ (sim lane). Week 8.

- [ ] **`WeaponDefinition` content** (`TUNE`: classes Glove, Bow, Sword, Spear/Battle axe,
      Staff; named weapons Raptor Talons, the unnamed bow, A Fine Line, Wuuthrad, Lightbringer;
      unique class weapons Barricades (needs work; **MVP-if-time**), Staff, Short blades;
      non-unique weapons usable by any class). Owner: _. Test: validation rejects a class-locked
      weapon in the wrong loadout. Done when: a new weapon is a content entry.
- [ ] **`AttackStrategy` implementations** (`melee`, `ranged-projectile`, `melee-with-ranged- flex`; heavy attack with cooldown for Wuuthrad and Lightbringer; parry as a status).
      Owner: _. Test: each named weapon's documented effect (bleed, protection reduction stacks,
      piercing, concussion, lightning stun) as a scenario. Done when: weapons select strategies
      by id.
- [ ] **`ArtifactDefinition` content + gadget slots Z/C** (`TUNE`: Sentinel Mortar with impact
      and air-burst modes; Magus Soul Orb (pending) with Cast Forward and Follower; the second
      Sentinel artifact and the Warrior artifact per INBOX). Owner: _. Test: artifacts are
      abilities with a gadget slot restriction. Done when: no separate artifact runtime exists.

**Success metric:** every named weapon and artifact in the reference doc has a content entry and
a scenario test, and weapons with abilities (idea pending) need only the existing `Ability`
composition.

## Sprint 4.5 — Loadout and progression

Owner: _ (sim lane). Week 8.

- [ ] **`Loadout` domain model + validation** (primary and secondary weapon, passive, artifacts
      1–2, armour set, abilities 1–3, per-class skin; validated against content and class
      restrictions; auto-build default per class). Owner: _. Test: an invalid combination
      reports every violation; the auto-build validates for all three classes. Done when: the
      same validator runs in core tests and the Phase 5 `LoadoutScreen`.
- [ ] **`Progression` component + `ProgressionSystem`** (XP from kills, assists, structures,
      checkpoints, camps and boss events; level curve; scaling of ability potency, health and
      aether per level, `TUNE`; "Ability upgrades on hold beyond basic level scaling" per the
      game doc). Owner: _. Test: a level-up raises the documented stats by the content curve.
      Done when: the curve is a table and the ability tree stays a post-MVP extension point.
- [ ] **In-match loadout adjustment (MVP-if-time)** (changing an ability or ultimate resets its
      cooldown; requires visiting a BuffTower or the Stronghold, `TUNE`). Owner: _. Test: only if
      implemented. Done when: documented either way.

**Status (2026-10-16, PR #31, Claudio):** `Progression` + `ProgressionSystem` started early (S2,
SCRUM-426): level curve and per-level health and aether from content, kill XP to the killer. Shared,
assist, structure, checkpoint, camp and boss XP and potency scaling remain, so the box stays open.

**Success metric:** a bot-vs-bot match ends with every Legend at a level consistent with its
XP events (asserted by an invariant), and loadout validation rejects 100% of a fixture set of
bad loadouts.

## Sprint 4.6 — Magus Revive and pick-up/throw

Owner: _ (sim lane B). Week 8.

- [ ] **Magus default action `Revive`** (`TUNE`: revives recently killed allies if intact;
      revived allies cannot be revived again for N s; revived units keep their team as a
      component, D10). Owner: _. Test: a corpse older than the window cannot be revived; the
      lockout applies. Done when: `Revive` is an `AbilityEffect` bound to the class default
      action. Cut line 10 in the roadmap.
- [ ] **Pick-up/throw (MVP-if-time)** (`Carry` component + `PickUpStrategy` per class:
      Warrior `Pick Up` low weight, Sentinel `Grab` high weight applying `crushed`, Magus
      `Levitate` medium weight; heavier objects slow the carrier). Owner: _. Test: weight limits
      per class; thrown objects use the projectile swept path. Done when: `Grasp` (Flying) is a
      strategy id with no implementation.

**Success metric:** `Revive` scenario tests pass; pick-up/throw either passes its tests or is
recorded as cut in [PROGRESS.md](PROGRESS.md).

## Sprint 4.7 — HUD ability bar and dynamic glyphs

Owner: _ (client lane). Weeks 7–8.

- [ ] _(feat/hud-and-character-select: `HealthBar`, `AetherBar` and the ability and gadget slots read store selectors only (`hudSlice`, `selectHudSlotView`), with server-render tests of the cooldown and ready looks (register CD-28); cooldowns, aether, charge and level stay `null` until core publishes `Snapshot.player`, architecture 05 §18)_ **`AbilityBar`, `AetherBar`, `HealthBar` HUD** fed by a throttled `legendSlice` in the
      bridge (cooldowns, aether, charge, level). Owner: _. Test: `react-dom/server` render
      snapshots for cooldown and ready states. Done when: the HUD reads store selectors only.
- [ ] **`<KeyGlyph action="…"/>`** renders the current binding for an `InputAction` (1–4
      abilities, Z/C gadgets, click to attack) so every prompt follows rebinding with no code
      change (requirements doc). Owner: _. Test: rebinding `ability-1` from `Digit1` to `KeyQ`
      in the store changes the rendered glyph. Done when: no key name is hard-coded in `ui/`.
- [ ] **Ability targeting overlay** (range rings and dash previews on the overlay layer through
      `Renderer`). Owner: _. Test: overlay draw calls with a fake context. Done when: `views/`
      still reads `Snapshot` only.

**Success metric:** a rebinding in the settings store updates every ability glyph and prompt on
the next render, verified by a test and by a reviewer in the browser.

## Success metrics (phase level)

| Metric                                          | Target                                                 |
| ----------------------------------------------- | ------------------------------------------------------ |
| MVP abilities and ultimates with scenario tests | 100%                                                   |
| Litmus test (new ability / weapon / class)      | three places touched, verified by tests that add fakes |
| Human play-through per class                    | each class played end to end by a teammate, signed off |
| Ability cost per tick with 20 Legends           | ≤ 0.5 ms p95 (`Recommendation:`)                       |
| Replay determinism with abilities               | identical hashes, 5 seeds × full match                 |
| Dynamic glyphs                                  | rebinding updates 100% of prompts with 0 code changes  |
| Coverage                                        | core ≥ 85%, client ≥ 60% (`Recommendation:`)           |

## Exit criteria

1. All sprint metrics pass and are recorded in [PROGRESS.md](PROGRESS.md).
2. Demo: pick each class, cast all abilities and the ultimate, level up from a camp clear, see
   the glyphs change after rebinding `ability-1`.
3. Architecture doc 05 and reference docs 01, 06, 07 and 08 match the code, or an ADR records
   the deviation; every "(rename pending)" note is still visible in content display names.
4. Phase PR approved (sholtzman + AI owner + product owner sign-off on abilities), CI green on
   three OSes, merged by SamarjitBhogal.

## Risks

| Risk                                            | Mitigation                                                                                               |
| ----------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| INBOX decisions (third ability, ultimates) late | Defaults apply on the decide-by date: third slot empty, first-listed ultimate; content can change later. |
| Ability feel needs iteration the schedule lacks | Ship the mechanic with `TUNE` values; balance in Phase 6; product owner reviews in the browser weekly.   |
| Framework over-generalised                      | Nine effects only; new effects are added when a content entry needs them, not before.                    |
| Pick-up/throw drags the sprint                  | Cut line 2; strategy interface stays.                                                                    |
| Two lanes editing `content/abilities/`          | One file per ability id; index file append-only.                                                         |

## Related

- [README.md](README.md)
- [phase-3-minions-hordes-and-ai.md](phase-3-minions-hordes-and-ai.md)
- [phase-5-meta-ui-and-persistence.md](phase-5-meta-ui-and-persistence.md)
- [PROGRESS.md](PROGRESS.md)
- [backlog-post-mvp.md](backlog-post-mvp.md)
- [../architecture/05-abilities-weapons-and-loadouts.md](../architecture/05-abilities-weapons-and-loadouts.md)
- [../architecture/13-game-interface.md](../architecture/13-game-interface.md)
- [../reference/game-design/01-classes-and-subclasses.md](../reference/game-design/01-classes-and-subclasses.md)
- [../reference/game-design/06-abilities-and-progression.md](../reference/game-design/06-abilities-and-progression.md)
- [../reference/game-design/07-weapons-and-artifacts.md](../reference/game-design/07-weapons-and-artifacts.md)
- [../reference/game-design/08-loadout.md](../reference/game-design/08-loadout.md)
- [../reference/suggestions/more-abilities.md](../reference/suggestions/more-abilities.md)
