import type { Horde } from '../../state/Horde.types';

/** The mob weight classes; a lane mob's kind is `<weight>-mob` (architecture 04 §1). */
export const WEIGHT_CLASSES: readonly Horde['weightClass'][] = ['light', 'medium', 'heavy'];
