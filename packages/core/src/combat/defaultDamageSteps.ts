import type { DamageStep } from './DamageStep.types';
import { BasicAttackLevelStep } from './BasicAttackLevelStep';
import { INTERIOR_ATTACK_DAMAGE_MULTIPLIER } from '../content/structures/interiorAttack';
import { BreakabilityStep } from './BreakabilityStep';
import { LEGEND_CLASSES } from '../content/legends/legendCatalogue';
import { STRUCTURE_MAP_OBJECT_KINDS } from '../content/maps/mapObjectDefinitions';
import type { ContentCatalogue } from '../content/ContentCatalogue';
import type { EntityDefinitionBase } from '../content/EntityDefinition.types';
import { BODY_PART_BONUS } from '../content/mobs/bodyPartBonus';
import { BOSS_MINION_DAMAGE_TAKEN, MINION_STRENGTH } from '../content/mobs/minionModifiers';
import { MOB_DEFINITIONS } from '../content/mobs/mobCatalogue';
import { BodyPartBonusStep } from './BodyPartBonusStep';
import { BossMinionDamageStep } from './BossMinionDamageStep';
import { FriendlyFireStep } from './FriendlyFireStep';
import { InteriorAttackStep } from './InteriorAttackStep';
import { MinionStrengthStep } from './MinionStrengthStep';
import type { LaneProgressOf } from './MinionStrengthStep.types';
import { StatusModifierStep } from './StatusModifierStep';

/**
 * The damage steps in the order every hit runs them (architecture 05 §9). This is the one place a
 * step is added: structure multipliers and breakability each add a line here.
 *
 * @param progressOf - Lane progress for the minion strength curve (DEC-384).
 * @param units - The match's unit definitions, for each Legend class's basic-attack scaling
 *   (`ProgressionContent.units`); the Legend classes alone when not given.
 */
export const createDefaultDamageSteps = (
  progressOf: LaneProgressOf,
  units: Pick<ContentCatalogue<EntityDefinitionBase>, 'has' | 'get'> = LEGEND_CLASSES,
): readonly DamageStep[] => [
  new BreakabilityStep(),
  new FriendlyFireStep(),
  new BasicAttackLevelStep(units, STRUCTURE_MAP_OBJECT_KINDS),
  new StatusModifierStep(),
  new MinionStrengthStep(MINION_STRENGTH, progressOf),
  new BossMinionDamageStep(BOSS_MINION_DAMAGE_TAKEN, MOB_DEFINITIONS.ids),
  new InteriorAttackStep(INTERIOR_ATTACK_DAMAGE_MULTIPLIER),
  new BodyPartBonusStep(BODY_PART_BONUS),
];
