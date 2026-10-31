import type { LegendSpecDefinition } from './legendSpecs.types';

/**
 * A Magus Legend whose sub-class title is "Catalyst" (DEC-49), the same on both teams. Its Legend
 * is Veridan on the Light team; the Dark name is derived from the mirror rule and confirmed by the
 * owner (DEC-58, INBOX HC-Q16). Role, description, ratings and detail rows are not written.
 */
export const CATALYST = {
  id: 'catalyst',
  classId: 'magus',
  isSelectable: true,
  displayName: 'Catalyst',
  legendName: {
    light: 'Veridan',
    dark: 'Nadirev',
  },
  roleLabel: null,
  description: null,
  roleRatings: null,
  detailNames: { ultimate: null, 'ability-1': null, 'ability-2': null, 'ability-3': null },
} as const satisfies LegendSpecDefinition;
