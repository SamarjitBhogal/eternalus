import type { AuthoredStructureAuraCadence } from './structures.types';

/** How often a structure's aura is refreshed (DEC-315 (4)). */
export const STRUCTURE_AURA_CADENCE = {
  everySeconds: 0.5, // TUNE: no reference value; as the veteran aura's
} as const satisfies AuthoredStructureAuraCadence;
