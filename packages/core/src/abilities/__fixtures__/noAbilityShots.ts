/**
 * The ability-shot part of `createDefaultProjectileImpacts` for tests that fly weapon shots only:
 * an ability shot never lands there, so each part throws if one does.
 */
export const NO_ABILITY_SHOTS = {
  hits: {
    runSteps: (): never => {
      throw new Error('No ability shot lands in this test.');
    },
  },
  abilities: {
    resolve: (): never => {
      throw new Error('No ability shot lands in this test.');
    },
  },
};
