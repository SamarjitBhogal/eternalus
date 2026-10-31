import { KindSet } from '../KindSet';
import type { LegendDefinition, LegendKind } from './legends.types';

/** Every Legend class's kind, in catalogue order. */
export const LEGEND_KIND_IDS: readonly LegendKind[] = ['warrior', 'sentinel', 'magus'];

/** The Legend classes, so content rules and systems can key on kind. */
export const LEGEND_KINDS = new KindSet<LegendDefinition>(LEGEND_KIND_IDS);
