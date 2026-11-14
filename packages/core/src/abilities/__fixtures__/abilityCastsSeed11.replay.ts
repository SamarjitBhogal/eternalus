import type { GameConfig } from '../../config/GameConfig.types';
import type { ReplayOf } from '../../diagnostics/Replay.types';
import { ABILITY_CASTS_PLAN } from './abilityCastsPlan';

/**
 * Golden replay of the shipped abilities (architecture 05 §16): seed 11, the default config of
 * 2026-11-13 (a 10 s countdown), the default systems on no map, and `ABILITY_CASTS_PLAN` for 450
 * ticks: a cast refused during the countdown (DEC-88), then Slam, Shockwave and Blade Runner cast
 * into enemy Legends, a concussed counter-cast and a cast refused on cooldown. If it stops reproducing, either a determinism bug crept in or the
 * rules changed on purpose; only the second may regenerate it.
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
      pathMaxExpansions: 6000,
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
      hash: 1524902526,
    },
    {
      tick: 100,
      hash: 957597168,
    },
    {
      tick: 150,
      hash: 1966690527,
    },
    {
      tick: 200,
      hash: 2808255539,
    },
    {
      tick: 250,
      hash: 992041804,
    },
    {
      tick: 300,
      hash: 2023768330,
    },
    {
      tick: 350,
      hash: 1639628759,
    },
    {
      tick: 400,
      hash: 3981001228,
    },
    {
      tick: 450,
      hash: 1192763010,
    },
  ],
};
