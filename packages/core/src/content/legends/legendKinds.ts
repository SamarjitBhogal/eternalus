import { KindSet } from '../KindSet';
import type { LegendDefinition } from './legends.types';

/** The Legend classes, so content rules and systems can key on kind. */
export const LEGEND_KINDS = new KindSet<LegendDefinition>(['warrior', 'sentinel', 'magus']);
