import { KindSet } from '../KindSet';
import type { MobDefinition } from './mobs.types';

/** The mob weight classes, so systems can key on kind. */
export const MOB_KINDS = new KindSet<MobDefinition>(['light-mob', 'medium-mob', 'heavy-mob']);
