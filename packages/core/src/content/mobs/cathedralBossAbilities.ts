import type { BossMoveDefinition } from './bossMoves.types';

/** Provisional Cathedral boss moves selectable by the encounter. Distances are world units. */
export const CATHEDRAL_BOSS_ABILITIES = [
  {
    id: 'faultline-slam',
    effect: 'line',
    charge: 0.75,
    active: 0.1,
    recovery: 0.55,
    range: 38,
    width: 8,
    damage: 650,
    sweep: 0,
  },
  {
    id: 'grasping-roots',
    effect: 'stun-line',
    charge: 0.7,
    active: 0.1,
    recovery: 0.55,
    range: 45,
    width: 5,
    damage: 300,
    sweep: 0,
  },
  {
    id: 'obsidian-bulwark',
    effect: 'shield',
    charge: 0.55,
    active: 3,
    recovery: 0.35,
    range: 0,
    width: 0,
    damage: 0,
    sweep: 0,
  },
  {
    id: 'gravity-collapse',
    effect: 'pull-area',
    charge: 1,
    active: 0.1,
    recovery: 0.6,
    range: 27,
    width: 0,
    damage: 750,
    sweep: 0,
  },
  {
    id: 'void-sweep',
    effect: 'line',
    charge: 2.5,
    active: 2.2,
    recovery: 0.9,
    range: 180,
    width: 5,
    damage: 1600,
    sweep: 2.6,
  },
] as const satisfies readonly BossMoveDefinition[]; // TUNE: first-pass encounter timings, reach and damage

/** TUNE: spacing between specials, temporary shield and pull distance. */
export const CATHEDRAL_BOSS_CAST = { delay: 4, shield: 4100, pull: 9 } as const;
