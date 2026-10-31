import type { LegendSpecDefinition } from './legendSpecs.types';

/**
 * A Sentinel Legend whose sub-class title is its `displayName` (DEC-49), the same on both teams. The
 * Legend has no name yet (`legendName: null`). The description is the owner's (DEC-49, as
 * relayed on 2026-10-17); role, ratings and detail rows are not written.
 */
export const JUGGERNAUT = {
  id: 'juggernaut',
  classId: 'sentinel',
  isSelectable: true,
  displayName: 'Bulwark',
  legendName: null,
  roleLabel: null,
  description: 'A siege-breaker — faster, lower health, used to assault front lines.',
  roleRatings: null,
  detailNames: { ultimate: null, 'ability-1': null, 'ability-2': null, 'ability-3': null },
} as const satisfies LegendSpecDefinition;
