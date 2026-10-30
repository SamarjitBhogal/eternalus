import type { OpeningWaveDefinition, SpawnWaveDefinition } from './structures.types';

/**
 * The opening hordes: at load-in (tick 0, before the countdown) each team's Stronghold sends one
 * light horde per lane, from the lane's base (DEC-84; architecture 12 §2, 18 §3.1).
 */
export const OPENING_WAVE = {
  mobId: 'light-minion',
  weightClass: 'light',
  source: 'stronghold',
} as const satisfies OpeningWaveDefinition;

/**
 * The horde waves of each spawning structure kind (DISC-10, architecture 18 §3.1), timed from the
 * countdown's end (DEC-87): lights first, so they reinforce the opening hordes; mediums 30 s after
 * each light wave; heavies down the worst lane. The opening hordes are separate (`OPENING_WAVE`).
 */
export const SPAWN_WAVES: Readonly<Record<string, readonly SpawnWaveDefinition[]>> = {
  'spawner-tower': [
    {
      mobId: 'light-minion',
      weightClass: 'light',
      firstAtSeconds: 120, // TUNE: DEC-87
      everySeconds: 60, // TUNE: DEC-87
      lane: 'own-lane',
    },
  ],
  'buff-tower': [
    {
      mobId: 'medium-minion',
      weightClass: 'medium',
      firstAtSeconds: 150, // TUNE: DEC-87
      everySeconds: 60, // TUNE: DEC-87
      lane: 'own-lane',
    },
  ],
  stronghold: [
    {
      mobId: 'heavy-minion',
      weightClass: 'heavy',
      firstAtSeconds: 180, // TUNE: DEC-87
      everySeconds: 90, // TUNE: DEC-87
      lane: 'worst-lane',
    },
  ],
};
