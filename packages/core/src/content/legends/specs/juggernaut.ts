import type { LegendSpecDefinition } from './legendSpecs.types';

/**
 * A Sentinel Legend whose sub-class title is "Juggernaut" (DEC-49), the same on both teams. The
 * Legend has no name yet (`legendName: null`). The description is the owner's (DEC-49, as
 * relayed on 2026-10-17); role, ratings and detail rows are not written.
 */
export const JUGGERNAUT = {
  id: 'juggernaut',
  classId: 'sentinel',
  displayName: 'Juggernaut',
  legendName: null,
  roleLabel: null,
  description: 'A siege-breaker — faster, lower health, used to assault front lines.',
  roleRatings: null,
  detailNames: { signature: null, specialty: null, ultimate: null },
} as const satisfies LegendSpecDefinition;
