import type { WorldPoint } from '../engine/render/Renderer.types';

/** Normalized artwork, authored once and scaled to the destroyed object's original footprint. */
export type RuinPiece = {
  readonly color: string;
  readonly points: readonly (readonly [number, number])[];
};

/** Presentation geometry only; wreckage never creates simulation colliders or fire damage. */
export type RuinArtwork = {
  readonly pieces: readonly RuinPiece[];
  readonly widthToHeight?: number;
  readonly anchorX?: number;
};

/** Cached world polygons avoid creating vertices on every frame. */
export type RuinPolygon = { readonly color: string; readonly shape: readonly WorldPoint[] };
