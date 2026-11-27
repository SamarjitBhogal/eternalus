import type { DamageStep } from './DamageStep.types';
import { BreakabilityStep } from './BreakabilityStep';
import { BOSS_MINION_DAMAGE_TAKEN, MINION_STRENGTH } from '../content/mobs/minionModifiers';
import { MOB_DEFINITIONS } from '../content/mobs/mobCatalogue';
import { BossMinionDamageStep } from './BossMinionDamageStep';
import { FriendlyFireStep } from './FriendlyFireStep';
import { MinionStrengthStep } from './MinionStrengthStep';
import type { LaneProgressOf } from './MinionStrengthStep.types';
import { SovereignProtectionStep } from './SovereignProtectionStep';
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
  new SovereignProtectionStep(),
  new FriendlyFireStep(),
  new StatusModifierStep(),
  new MinionStrengthStep(MINION_STRENGTH, progressOf),
  new BossMinionDamageStep(BOSS_MINION_DAMAGE_TAKEN, MOB_DEFINITIONS.ids),
];
