import type { LegendSpecDefinition } from './legendSpecs.types';

/**
 * A Legionnaire Legend whose sub-class title is "Centurion" (content id `knight`; DEC-49). The title
 * is the same on both teams. The Legend has no name yet (`legendName: null`): only its class and
 * sub-class title exist, so its description, role, ratings and detail rows are not written.
 */
export const KNIGHT = {
  id: 'knight',
  classId: 'warrior',
  isSelectable: true,
  displayName: 'Centurion',
  legendName: null,
  roleLabel: null,
  description: null,
  roleRatings: null,
  detailNames: { signature: null, specialty: null, ultimate: null },
} as const satisfies LegendSpecDefinition;
