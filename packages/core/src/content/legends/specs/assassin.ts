import type { LegendSpecDefinition } from './legendSpecs.types';

/**
 * A warrior Legend whose sub-class title is its `displayName` (content id `assassin`; DEC-49). The title
 * is the same on both teams. The Legend has no name yet (`legendName: null`): only its class and
 * sub-class title exist, so its description, role, ratings and detail rows are not written.
 */
export const ASSASSIN = {
  id: 'assassin',
  classId: 'warrior',
  isSelectable: true,
  displayName: 'Zealot',
  legendName: null,
  roleLabel: null,
  description: null,
  roleRatings: null,
  detailNames: { ultimate: null, 'ability-1': null, 'ability-2': null, 'ability-3': null },
} as const satisfies LegendSpecDefinition;
