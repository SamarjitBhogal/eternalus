import type { DamageStep } from './DamageStep.types';
import { BreakabilityStep } from './BreakabilityStep';
import { MINION_STRENGTH } from '../content/mobs/minionModifiers';
import { FriendlyFireStep } from './FriendlyFireStep';
import { MinionStrengthStep } from './MinionStrengthStep';
import type { LaneProgressOf } from './MinionStrengthStep.types';
import { StatusModifierStep } from './StatusModifierStep';

/**
 * The damage steps in the order every hit runs them (architecture 05 §9). This is the one place a
 * step is added: structure multipliers and breakability each add a line here.
 *
 * @param progressOf - Lane progress for the minion strength curve (the lane flow fields); `null`
 *   measures it along the lane polyline.
 */
export const createDefaultDamageSteps = (
  progressOf: LaneProgressOf | null = null,
): readonly DamageStep[] => [
  new BreakabilityStep(),
  new FriendlyFireStep(),
  new StatusModifierStep(),
  new MinionStrengthStep(MINION_STRENGTH, progressOf),
];
