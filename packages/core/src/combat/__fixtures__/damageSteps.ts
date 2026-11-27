import type { DamageStep } from '../DamageStep.types';
import { createDefaultDamageSteps } from '../defaultDamageSteps';

/**
 * The default damage steps with lane progress that never says, so every minion hits at strength 1
 * (DEC-384): for tests of the other rules. A test of minion strength injects its own lane progress.
 */
export const damageStepsWithoutLaneProgress = (): readonly DamageStep[] =>
  createDefaultDamageSteps(() => null);
