import type { OpeningWaveDefinition, SpawnWaveDefinition } from './structures.types';

/**
 * The Stronghold's opening hordes: `GameConfig.match.initialHordesPerTeam` light hordes at tick 0
 * (architecture 12 §2, 18 §3.1).
 */
export const OPENING_WAVE = {
  mobId: 'light-minion',
  weightClass: 'light',
} as const satisfies OpeningWaveDefinition;

/**
 * The horde waves of each spawning structure kind: the owner's spawn schedule DISC-10
 * (decisions log), architecture 18 §3.1. The Stronghold's opening hordes are separate:
 * `GameConfig.match.initialHordesPerTeam` light hordes at tick 0.
 */
export const SPAWN_WAVES: Readonly<Record<string, readonly SpawnWaveDefinition[]>> = {
  'spawner-tower': [
    { mobId: 'light-minion', weightClass: 'light', everySeconds: 60, lane: 'own-lane' }, // TUNE: DISC-10
  ],
  'buff-tower': [
    { mobId: 'medium-minion', weightClass: 'medium', everySeconds: 120, lane: 'own-lane' }, // TUNE: DISC-10
  ],
  stronghold: [
    // TUNE: DISC-10. Recommendation: the first heavy horde at the countdown's end like the towers'
    // (12 §2); the owner may move it to 180 s later (INBOX).
    { mobId: 'heavy-minion', weightClass: 'heavy', everySeconds: 180, lane: 'worst-lane' },
  ],
};
