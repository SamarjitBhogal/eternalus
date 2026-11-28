import type { BiomeKind } from '../content/maps/maps.types';

/** Immutable inputs for the ground-style painters selected by the biome content profile. */
export type BiomeDetail = {
  readonly id: string;
  readonly x: number;
  readonly y: number;
  readonly n: number;
  readonly kind: BiomeKind;
};
