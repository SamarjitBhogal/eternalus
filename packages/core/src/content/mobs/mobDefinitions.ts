import { ContentCatalogue } from '../ContentCatalogue';
import { HEAVY_MOB } from './heavyMob';
import { LIGHT_MOB } from './lightMob';
import { MEDIUM_MOB } from './mediumMob';
import type { MobDefinition } from './mobs.types';
import { TRAINING_DUMMY } from './trainingDummy';

/** Every mob definition: the three weight classes, then the training dummy. */
export const MOB_DEFINITIONS = new ContentCatalogue<MobDefinition>([
  LIGHT_MOB,
  MEDIUM_MOB,
  HEAVY_MOB,
  TRAINING_DUMMY,
]);
