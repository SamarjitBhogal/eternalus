import { ContentCatalogue } from '../../ContentCatalogue';
import { FLYING } from './flying';
import type { LockedClassDefinition } from './lockedClasses.types';

/**
 * Every class the selection screen shows locked, in card order after the playable classes
 * (DEC-48). The client reads it through `loadDisplayContent()`.
 */
export const LOCKED_CLASSES = new ContentCatalogue<LockedClassDefinition>([FLYING]);
