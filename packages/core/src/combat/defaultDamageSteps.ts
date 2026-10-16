import type { DamageStep } from './DamageStep.types';
import { FriendlyFireStep } from './FriendlyFireStep';

/**
 * The damage steps in the order every hit runs them (architecture 05 §9). This is the one place a
 * step is added: statuses, structure multipliers and breakability each add a line here.
 */
export const createDefaultDamageSteps = (): readonly DamageStep[] => [new FriendlyFireStep()];
