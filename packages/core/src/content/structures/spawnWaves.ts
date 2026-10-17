import type { SpawnWaveDefinition } from './structures.types';

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
    { mobId: 'heavy-minion', weightClass: 'heavy', everySeconds: 180, lane: 'worst-lane' }, // TUNE: DISC-10
  ],
};
