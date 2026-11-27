import type { LegendSpecDefinition } from './legendSpecs.types';

/**
 * A Sentinel Legend whose sub-class title is "Colossus" (DEC-49), the same on both teams. The
 * Legend has no name yet (`legendName: null`). The description is the owner's (DEC-49, as
 * relayed on 2026-10-17); role, ratings and detail rows are not written.
 */
export const COLOSSUS = {
  id: 'colossus',
  classId: 'sentinel',
  isSelectable: true,
  displayName: 'Colossus',
  legendName: null,
  roleLabel: null,
  description: 'Heaviest, slowest, strongest — a walking tank that specialises in fortifications.',
  roleRatings: null,
  primaryWeaponId: 'bastions', // DEC-407; DEC-387 (W3); DEC-57
  detailNames: { ultimate: null, 'ability-1': null, 'ability-2': null, 'ability-3': null },
  kit: null, // the class default kit; no Legend has its own yet
  passiveId: null, // the class default, Wrecking Run
  secondaryWeaponId: null,
  artifacts: [null, null],
} as const satisfies LegendSpecDefinition;
