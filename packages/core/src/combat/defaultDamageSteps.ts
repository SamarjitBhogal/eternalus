import type { DamageStep } from './DamageStep.types';
import { FriendlyFireStep } from './FriendlyFireStep';
import { StatusModifierStep } from './StatusModifierStep';

/**
 * The damage steps in the order every hit runs them (architecture 05 §9). This is the one place a
 * step is added: structure multipliers and breakability each add a line here.
 */
export const createDefaultDamageSteps = (): readonly DamageStep[] => [
  new FriendlyFireStep(),
  new StatusModifierStep(),
];
