import type { LegendSpecDefinition } from './legendSpecs.types';

/**
 * A Magus Legend whose sub-class title is its `displayName` (DEC-49; it replaces the Figma's
 * "Gravecaller"), the same on both teams. Its Legend is Avedrin on the Light team and Nirdeva on
 * the Dark team (both owner-stated). Role, description, ratings and detail rows are not written.
 */
export const NECROMANCER = {
  id: 'necromancer',
  classId: 'magus',
  isSelectable: true,
  displayName: 'Heretic',
  legendName: { light: 'Avedrin', dark: 'Nirdeva' },
  roleLabel: null,
  description: null,
  roleRatings: null,
  detailNames: { ultimate: null, 'ability-1': null, 'ability-2': null, 'ability-3': null },
} as const satisfies LegendSpecDefinition;
