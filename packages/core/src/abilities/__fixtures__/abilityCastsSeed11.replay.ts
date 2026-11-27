import type { GameConfig } from '../../config/GameConfig.types';
import type { ReplayOf } from '../../diagnostics/Replay.types';
import { ABILITY_CASTS_PLAN } from './abilityCastsPlan';

/**
 * Golden replay of the shipped abilities (architecture 05 §16): seed 11, the default config of
 * 2026-11-13 (a 10 s countdown), the default systems on no map, and `ABILITY_CASTS_PLAN` for 450
 * ticks: a cast refused during the countdown (DEC-88), then Slam, Shockwave and Blade Runner cast
 * into enemy Legends, a concussed counter-cast and a cast refused on cooldown. If it stops reproducing, either a determinism bug crept in or the
 * rules changed on purpose; only the second may regenerate it. Regenerated 2026-11-14 for
 * out-of-combat healing (DEC-188, merged from phase/3): checkpoints 0 to 300 and the commands were
 * unchanged, and without `OutOfCombatHealingSystem` the old hashes still reproduced. Regenerated
 * 2026-11-15 when phase/3 began hashing facing (DEC-192) and the scoring state (#93): the
 * commands and checkpoint 0 were unchanged, and with those two hash fields left out the old hashes
 * still reproduced. `config.map.pathMaxExpansions: 6000` became `pathMaxSearchArea: 150000` on
 * 2026-11-19 with the phase/3 merge of DEC-243: the same 6000 cells on this config's 5 m cells; it
 * is not hashed, and every checkpoint reproduced unchanged. Regenerated 2026-11-22 when the hash
 * began to cover a hit record without a target (DEC-322 (2), PR 2 round 2): checkpoints 0 to 300
 * and the commands were unchanged; a dump every 10 ticks of positions, health, motion, facing,
 * statuses, abilities, the RNG and the AI brains matched the old code at every tenth tick to 450,
 * and only the new `hits` fields differed. The round-3 correctness critic hashed the full state on
 * every tick to 450 with the old hasher minus its `hits` line: identical. Regenerated 2026-11-25
 * when phase/3 (#132) began hashing `LastEnemyHit` (DEC-346): the commands and checkpoints 0 to
 * 300 were unchanged, and with that hash field left out the old hashes still reproduced.
 * Regenerated 2026-11-27 when one merge brought together the `hits` field (DEC-322 (2)) and the
 * `LastEnemyHit` field (DEC-346): the commands and checkpoints 0 to 300 were unchanged, and the
 * merged code hashed with each parent's own `StateHasher` reproduced that parent's checkpoints
 * (and with the merge base's hasher, the hashes from before both fields).
 */
export const ABILITY_CASTS_SEED_11: ReplayOf<{
  readonly seed: number;
  readonly config: GameConfig;
}> = {
  seed: 11,
  config: {
    tickRate: 30,
    map: {
      numLanes: 3,
      spawnTowersPerLane: 1,
      buffTowersPerLane: 1,
      campsPerSide: 6,
      cornerCamps: 4,
      worldWidth: 1600,
      worldHeight: 900,
      navCellSize: 5,
      flowFieldCorridorHalfWidth: 30,
      flowFieldCellBudget: 2000,
      pathMaxSearchArea: 150000,
      pathSnapCells: 12,
      presetId: 'map-1',
    },
    match: {
      legendsPerTeam: 10,
      legendsPerLane: 3,
      countdownSeconds: 10,
      hordeSizes: {
        light: 16,
        medium: 8,
        heavy: 4,
      },
      plannedMatchSeconds: 1800,
      playerTeam: 'light',
      capturePoints: {
        checkpoints: 3,
        captureSeconds: 12,
        revertSeconds: 20,
        maxMargin: 3,
        weights: {
          legend: 10,
          unit: 1,
        },
      },
      timeline: [
        {
          id: 'countdown-over',
          at: {
            atTick: 300,
          },
          action: {
            kind: 'enter-phase',
            phase: 'early-game',
          },
        },
        {
          id: 'quarter-mark',
          at: {
            atFraction: 0.25,
          },
          action: {
            kind: 'enter-phase',
            phase: 'quarter-mark',
          },
        },
        {
          id: 'mid-game',
          at: {
            atFraction: 0.5,
          },
          action: {
            kind: 'enter-phase',
            phase: 'mid-game',
          },
        },
        {
          id: 'end-game',
          at: {
            atFraction: 0.75,
          },
          action: {
            kind: 'enter-phase',
            phase: 'end-game',
          },
        },
      ],
    },
    limits: {
      maxLegendsPerTeam: 10,
      maxUnitsPerTeam: 300,
    },
  },
  commands: Object.entries(ABILITY_CASTS_PLAN).flatMap(([tick, commands]) =>
    commands.map((command) => ({ tick: Number(tick), command })),
  ),
  checkpoints: [
    {
      tick: 0,
      hash: 300628483,
    },
    {
      tick: 50,
      hash: 2184706502,
    },
    {
      tick: 100,
      hash: 2141419056,
    },
    {
      tick: 150,
      hash: 3366307571,
    },
    {
      tick: 200,
      hash: 2910192951,
    },
    {
      tick: 250,
      hash: 3333785740,
    },
    {
      tick: 300,
      hash: 2323298770,
    },
    {
      tick: 350,
      hash: 1657237848,
    },
    {
      tick: 400,
      hash: 3314881132,
    },
    {
      tick: 450,
      hash: 2759818172,
    },
  ],
};
