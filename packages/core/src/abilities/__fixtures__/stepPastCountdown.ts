import type { Simulation } from '../../Simulation';

/**
 * Steps `sim` at least once, then until the match leaves the countdown, which holds every unit
 * idle and refuses casts (DEC-88); the next step is the first one not held.
 */
export const stepPastCountdown = (sim: Simulation): void => {
  do {
    sim.step();
  } while (sim.snapshot().match.phase === 'countdown');
};
