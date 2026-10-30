import { ContentCatalogue } from '../ContentCatalogue';
import { HEAVY_MINION } from './heavyMinion';
import { LIGHT_MINION } from './lightMinion';
import { MEDIUM_MINION } from './mediumMinion';
import type { MobDefinition } from './mobs.types';
import { TRAINING_DUMMY } from './trainingDummy';

/** Every mob definition: the training dummy and the three lane minions. */
export const MOB_DEFINITIONS = new ContentCatalogue<MobDefinition>([
  TRAINING_DUMMY,
  LIGHT_MINION,
  MEDIUM_MINION,
  HEAVY_MINION,
]);
