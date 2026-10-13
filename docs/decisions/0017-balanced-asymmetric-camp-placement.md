---
title: 0017. Balanced asymmetric camp placement
description: Proposed amendment to ADR 0009 for DEC-15 - forest camps are placed by the seeded RNG independently on each side of the centre line and are bound by per-class count parity instead of mirror symmetry, while everything else on the map stays mirrored and obstacles keep clear of the camps on both sides - with the failure rule for a band that cannot hold its camp, the validation and test changes, the ordering after audit item A8-1 and the open questions; read this before changing camp placement, obstacle scatter, the mirror check or the map's golden hash.
audience: [humans, agents]
status: draft
owner: sholtzman
last-reviewed: 2026-10-10
tags: [adr, map, camps, symmetry, determinism]
related:
  - 'docs/decisions/0009-config-driven-map-generation.md'
  - 'docs/architecture/06-map-and-minimap.md'
  - 'docs/reviews/2026-10-10-new-requirements-impact.md'
  - 'docs/reference/game-design/13-owner-decisions-log.md'
  - 'docs/requirements/06-mvp-requirements.md'
  - 'docs/plan/multiplayer-and-scalability-plan.md'
---

# 0017. Balanced asymmetric camp placement

- Status: proposed (drafted 2026-10-10 for DEC-15; amends ADR 0009 for forest camps only; the
  generator does not change until the product owner accepts it)
- Date: 2026-10-10

## Context

ADR 0009 makes the generated map "symmetric about the centre" and lists "mirror symmetry" among its
tests. Architecture 06 builds on it: "the map is always mirrored west ↔ east … so there is no
symmetry setting" (§2), every feature is placed for the west half and mirrored (§3, "Symmetry is
not a step"), and §7 states the mirror invariant and that "a different seed changes only obstacle
scatter". The code enforces it on every `generate`: `MapBuilder.placeCamps` computes camp slots for
the west half from their index, with no randomness, assigns the class whose `minDepth` the slot's
depth reaches (DISC-42), and mirrors each camp east through `addMirrored`; `validateMapDefinition`
then rejects any map for which `findAsymmetries` (`map/mapSymmetry.ts`) reports a feature without a
mirrored twin.

DEC-15 (`docs/reference/game-design/13-owner-decisions-log.md`) changes that for camps. The owner's
words: keep depth-based weights but "define the classes by position in the corridor", "where the
vertical line down the centre of the map defines the division. RNG determines the location of the
camps on each side so both sides are different, but they must equate in terms of overall difficulty
(1 light on left means 1 light on right; not necessarily in mirrored locations but the same amount of
weighted camps on left team and right team's sides)". Mirrored camps cannot differ between sides,
so the invariant must change for them.

## Decision

Proposed.

1. **What stops being mirrored: forest camps (`kind: 'camp'`) only.** Everything else stays
   mirrored exactly as ADR 0009 and 06 say: Strongholds, lanes, lane structures, wall rings, gates,
   turrets, capture points and the Cathedral, the rift, out-of-bounds terrain, bridge segments and
   scattered obstacles. The corridors themselves are bounded by the mirrored lanes, so corridor
   geometry stays mirrored; only where camps sit inside them differs. Corner camps stay mirrored
   until the owner answers open question 1.
2. **The sides.** The vertical centre line, the axis `mirrorPoint` already uses, divides the map
   (DEC-15). A camp belongs to the side its position lies on; no camp sits on the line.
3. **Class first, then position (the proposed reading; open question 5 asks the owner to choose
   between it and class by rank).** Per side and per corridor, the generator takes the corridor's
   camp count (from `distributeCamps`, unchanged, so both sides get the same counts per corridor)
   and the class list for that count from content (`MapLayout.camps`, next to today's weight
   classes). It then draws each camp's position with the map's seeded `Rng` inside the depth band
   of its class (the bands follow from the existing `minDepth` thresholds), within the corridor's
   camp band and the clearances that apply today. A camp's class therefore still follows its depth
   ("keep depth-based weights"), and its place in the corridor ("nearest the lane light, middle
   medium, deepest heavy") is where its band lies.
4. **Fixed draw order.** West side before east, corridors in index order, slots in list order; a
   rejected sample still consumes the `Rng`, as obstacle scatter does (06 §3 step 8). Camps are
   drawn before obstacles. The map stays a pure function of config and seed (ADR 0009 unchanged on
   that).
5. **Parity replaces mirroring for camps.** For every camp `definitionId`, the number of camps west
   of the centre line equals the number east of it. Because per-corridor counts and class lists are
   the same on both sides, parity also holds per corridor by construction; whether the validator
   enforces the per-corridor form is open question 2.
6. **Obstacles stay mirrored and keep clear of the camps on both sides.** `scatterObstacles`
   (`map/obstacleScatter.ts`) samples only the west half and checks each sample against
   `occupied`, then `MapBuilder.scatterObstacles` mirrors every kept obstacle east. Today every
   east feature is the mirror of a west one, so a sample clear of the west features is also clear
   once mirrored. With independent east camps that no longer holds: a sample clear of every west
   feature can land, once mirrored, on or within `featureClearance` of an east camp. So each sample
   is also checked at its mirror image against the east camps: `MapBuilder.scatterObstacles` adds
   the mirror image (`mirrorPoint`, `map/symmetry.ts`) of every camp east of the centre line to
   `occupied`. The scatter's draw count per sample does not change.
7. **A band that cannot hold its camp fails loudly, never silently or forever.** A class's band is
   empty when content gives it no depth range (a `minDepth` of 1 or more, since depth is 1 at the
   corridor's middle), and it can be too thin in a given world for a camp to fit with its clearances
   (narrow corridors at small world heights or many lanes). Three guards:
   - **Layout validation.** `validateMapLayout` adds rules that every `minDepth` is below 1 and
     that every class a corridor class list names exists in `weightClasses`, each with a test that
     breaks it on purpose.
   - **Bounded attempts.** Each camp gets at most a content number of position samples
     (`MapLayout.camps`, a `Recommendation:` value marked `TUNE`), each consuming the same fixed
     number of `Rng` draws whether kept or not. When the bound is reached the generator throws
     `MapGenerationError` naming the side, the corridor index and the class (`definitionId`); it
     never loops without bound or drops the camp.
   - **A test across world heights.** For several lane counts and world heights, from the smallest
     the generator accepts upwards, generation either places every camp inside its class's band or
     throws that named error, and the default config and every shipped preset never throw.

   Whether a rejected config is acceptable, or the generator should fall back for that corridor,
   is open question 6.

### Validation and tests

- `findAsymmetries` skips features of kind `camp`, and only that kind. `validateMapDefinition` adds
  a parity rule that names the definition and both counts, and rejects a camp on the centre line.
  Each rule gets a test with a deliberately broken map (`AGENTS.md`, "Testing").
- `MapGenerator.test.ts`:
  - "changes only the scattered obstacles when the seed changes" becomes "changes only camp and
    obstacle positions": non-camp features and lanes stay equal across seeds, and each side's class
    counts stay equal.
  - "makes camps heavier the deeper they sit between lanes (DISC-42)" is replaced by "every camp
    lies inside its class's depth band" plus a parity test over several lane counts and seeds.
  - "is mirror-symmetric in every feature, terrain shape and lane (%i lanes)" and the scaled-preset
    symmetry assertion keep passing through the camp exemption; a new test shows that two seeds
    give different camp positions.
  - "mirrors every Light feature onto a Dark one" is unaffected: it checks team features, and camps
    are neutral.
  - A new test: over several seeds and lane counts, no obstacle on either side lies within
    `featureClearance` of any camp (point 6). It fails today's scatter once east camps are no
    longer mirrored, so it is written first.
  - The tests of point 7: the empty-band layout rules, the named error when attempts run out, and
    the sweep across world heights.
  - The golden hash is re-pinned once, deliberately, in the PR that lands this change. Camps now
    consume the `Rng` before `scatterObstacles`, and obstacles keep clear of camps on both sides,
    so obstacle positions move for a given seed too.
- `campPlacement.test.ts` follows `placeCampSlots`, which gains the `Rng` and the class list.
- `validateGameConfig`'s "`cornerCamps` must be even (corner camps are mirrored)" rule stays while
  corner camps stay mirrored.

### Order of work

1. Audit item AM-1 (align the `map/` import lists), then **A8-1**: session A's stand-in swap
   (`MapRandom` → `SeededRandom`, `DEFAULT_MAP_CONFIG` → `GameConfig.map`), which changes the random
   stream by itself and re-pins the golden hash once.
2. This change, second, so each golden-hash re-pin has exactly one cause.
3. AM-3 (`validateMapPreset`, including a rule that keeps corner camps on their half) and AM-19
   (corner camps "behind impassable rifts") touch the same function; they follow, or join, step 2
   with the map reviewer's agreement (Aryan Walanj, DEC-04).

### Documents to amend if accepted

ADR 0009 keeps its body (ADR 0011); its Status line gains "amended by 0017 (forest camps)".
Architecture 06 §2 ("always mirrored"), §3 step 5 and "Symmetry is not a step", §7 "Mirror
invariant" and "Determinism", and the §10 "Camp weights" row; FR-014 ("two symmetric territories")
and its acceptance, and FR-032; `docs/reference/game-design/05-map.md` ("the Dark side mirrors
it"); `docs/reference/suggestions/balancing.md` (camp weights); and the DISC-42 row of the
decisions log (impact review §5.3, CW-1 to CW-3).

## Consequences

- Each side's forest differs from match to match, reproducibly from the seed, and the two sides
  always hold the same number of camps of each class.
- Fairness is guaranteed by count only: one side's camps may sit nearer its lanes or Stronghold
  than the other's (open question 4).
- Navigation, flow fields and the minimap need no change: they read features from the definition
  whatever their positions.
- Replays and saved matches are unaffected because they record the seed; any fixture pinned to a
  camp or obstacle position is re-recorded with the golden hash.
- The Duel arena (DEC-36) has no camps, so this ADR does not touch it.

## Alternatives considered

1. **Keep mirroring and only fix the weights.** Meets "equal difficulty" but not "both sides are
   different". Rejected.
2. **Random positions with no parity check.** Breaks "they must equate in terms of overall
   difficulty". Rejected.
3. **Parity of a summed difficulty score** (one heavy worth so many light). More placements become
   possible, but the owner asked for per-class counts ("1 light on left means 1 light on right").
   Rejected.

Class by depth rank within each corridor (the impact review's CW-4 reading) is not rejected: it is
the other reading of the owner's words, and the choice is his (open question 5).

## Open questions for the owner

All six are in the plan's question list (`docs/plan/multiplayer-and-scalability-plan.md` §9,
DEC-15 group); 1, 2 and 4 are also asked under DEC-15 in `INBOX.md`.

1. Does the random, parity-checked placement also apply to the corner camps (MVP-if-time, first in
   the cut order)?
2. Is parity checked per side only, or also per corridor?
3. Which classes does a corridor hold when it has other than three camps (for example two, or four
   when `campsPerSide` or `numLanes` changes)? The answer becomes the content class list.
4. Only counts are matched: is it acceptable that one side's camps may sit nearer its lanes or
   Stronghold, or should the generator also bound that difference?
5. Which reading of "define the classes by position in the corridor": class by depth band (point 3,
   this draft's proposal), or class by depth rank within the corridor (impact review CW-4)? Band
   keeps "deeper is heavier" absolute but can fail in a narrow corridor (point 7); rank always
   places every camp, but a heavy camp may sit beside a lane when every draw falls there.
6. When a corridor is too narrow for a class's band, is rejecting the config with a named error
   (point 7) acceptable, or should the generator fall back, for example to rank, for that corridor?
