import { ContentCatalogue } from '../ContentCatalogue';
import type { MobDefinition } from './mobs.types';
// PROTOTYPE(PROTO-01) TEMPORARY: the demo escort minion; delete with `lightMinion.ts`.
import { LIGHT_MINION } from './lightMinion';
import { TRAINING_DUMMY } from './trainingDummy';

/** Every mob definition. Real mobs are added here by the mob work (SCRUM-59). */
export const MOB_DEFINITIONS = new ContentCatalogue<MobDefinition>([TRAINING_DUMMY, LIGHT_MINION]);
