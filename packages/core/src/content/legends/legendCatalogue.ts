import { ContentCatalogue } from '../ContentCatalogue';
import type { LegendDefinition } from './legends.types';
import { MAGUS } from './magus';
import { SENTINEL } from './sentinel';
import { WARRIOR } from './warrior';

/** Every playable Legend class, in character-select order. */
export const LEGEND_CLASSES = new ContentCatalogue<LegendDefinition>([WARRIOR, SENTINEL, MAGUS]);
