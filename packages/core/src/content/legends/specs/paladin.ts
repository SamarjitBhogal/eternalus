import type { LegendSpecDefinition } from './legendSpecs.types';

/**
 * A warrior Legend whose sub-class title is its `displayName` (content id `paladin`; DEC-49). The title
 * is the same on both teams. The Legend has no name yet (`legendName: null`): only its class and
 * sub-class title exist, so its description, role, ratings and detail rows are not written.
 */
export const PALADIN = {
  id: 'paladin',
  classId: 'warrior',
  isSelectable: true,
  displayName: 'Paladin',
  legendName: null,
  roleLabel: null,
  description: null,
  roleRatings: null,
  detailNames: { ultimate: null, 'ability-1': null, 'ability-2': null, 'ability-3': null },
  kit: null, // the class default kit; no Legend has its own yet
  passiveId: null, // the Vanguard has no passive (DISC-38)
} as const satisfies LegendSpecDefinition;
