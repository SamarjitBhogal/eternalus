/**
 * The ability-shot part of `createDefaultProjectileImpacts` for tests that fly weapon shots only:
 * an ability shot never lands there, so it throws if one does.
 */
export const NO_ABILITY_SHOTS = {
  runSteps: (): never => {
    throw new Error('No ability shot lands in this test.');
  },
};
