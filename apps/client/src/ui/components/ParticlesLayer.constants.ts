/**
 * R2 low-discrepancy sequence steps (frac(i × step)): particles spread evenly with no RNG, so the
 * same set always renders the same picture (and server-render tests are stable).
 */
export const PARTICLE_STEP_X = 0.7548776662;
export const PARTICLE_STEP_Y = 0.569840291;
export const PARTICLE_STEP_DELAY = 0.6180339887;
