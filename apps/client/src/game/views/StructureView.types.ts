import type { AuraRing } from './auraRing.types';

/** One structure's aura as drawn: its ring and its colours (`StructureView`, DEC-323 (3)). */
export type AuraField = {
  readonly ring: AuraRing;
  readonly fillColor: string;
  readonly ringColor: string;
  readonly particleColor: string;
};
