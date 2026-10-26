import type { LegendSpecDefinition } from './legendSpecs.types';

/**
 * A Magus Legend whose sub-class title is "Catalyst" (DEC-49), the same on both teams. Its Legend
 * is Veridan on the Light team; the Dark name is derived from the mirror rule, not stated by the
 * owner (INBOX HC-Q16). Role, description, ratings and detail rows are not written.
 */
export const CATALYST = {
  id: 'catalyst',
  classId: 'magus',
  isSelectable: true,
  displayName: 'Catalyst',
  legendName: {
    light: 'Veridan',
    // TODO(sam): Dark name derived from the mirror rule; confirm (INBOX HC-Q16)
    dark: 'Nadirev',
  },
  roleLabel: null,
  description: null,
  roleRatings: null,
  detailNames: { signature: null, specialty: null, ultimate: null },
} as const satisfies LegendSpecDefinition;
