import { ContentCatalogue } from '../ContentCatalogue';
import { HEAVY_CAMP_MOB } from './heavyCampMob';
import { HEAVY_GUARD } from './heavyGuard';
import { LIGHT_CAMP_MOB } from './lightCampMob';
import { MEDIUM_CAMP_MOB } from './mediumCampMob';
import { HEAVY_MINION } from './heavyMinion';
import { LIGHT_GUARD } from './lightGuard';
import { MEDIUM_GUARD } from './mediumGuard';
import { LIGHT_MINION } from './lightMinion';
import { MEDIUM_MINION } from './mediumMinion';
import type { MobDefinition } from './mobs.types';
import { TRAINING_DUMMY } from './trainingDummy';

/** Every mob definition: the training dummy, the three lane minions, the three tower guards and the three camp mobs. */
export const MOB_DEFINITIONS = new ContentCatalogue<MobDefinition>([
  TRAINING_DUMMY,
  LIGHT_MINION,
  MEDIUM_MINION,
  HEAVY_MINION,
  LIGHT_GUARD,
  MEDIUM_GUARD,
  HEAVY_GUARD,
  LIGHT_CAMP_MOB,
  MEDIUM_CAMP_MOB,
  HEAVY_CAMP_MOB,
]);
