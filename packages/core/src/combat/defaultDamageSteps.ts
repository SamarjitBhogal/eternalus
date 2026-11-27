import type { DamageStep } from './DamageStep.types';
import { BreakabilityStep } from './BreakabilityStep';
import { BOSS_MINION_DAMAGE_TAKEN, MINION_STRENGTH } from '../content/mobs/minionModifiers';
import { MOB_DEFINITIONS } from '../content/mobs/mobCatalogue';
import { BossMinionDamageStep } from './BossMinionDamageStep';
import { FriendlyFireStep } from './FriendlyFireStep';
import { MinionStrengthStep } from './MinionStrengthStep';
import type { LaneProgressOf } from './MinionStrengthStep.types';
import { StatusModifierStep } from './StatusModifierStep';

/**
 * The damage steps in the order every hit runs them (architecture 05 §9). This is the one place a
 * step is added: structure multipliers and breakability each add a line here.
 *
 * @param progressOf - Lane progress for the minion strength curve (DEC-384).
 */
export const createDefaultDamageSteps = (progressOf: LaneProgressOf): readonly DamageStep[] => [
  new BreakabilityStep(),
  new FriendlyFireStep(),
  new StatusModifierStep(),
  new MinionStrengthStep(MINION_STRENGTH, progressOf),
  new BossMinionDamageStep(BOSS_MINION_DAMAGE_TAKEN, MOB_DEFINITIONS.ids),
];
