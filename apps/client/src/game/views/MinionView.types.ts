import type { WorldPoint } from '../engine/render/Renderer.types';

/** Visual weight classes; these never change the entity's simulation radius or statistics. */
export type MinionWeight = 'light' | 'medium' | 'heavy';

/** Faction materials shared by every weight silhouette. */
export type MinionPalette = {
  readonly armor: string;
  readonly highlight: string;
  readonly trim: string;
  readonly cloth: string;
  readonly skin: string;
  readonly eyes: string;
  readonly hasHorns: boolean;
};

/** Cached local-space polygon painted through the renderer port. */
export type MinionPart = { readonly shape: readonly WorldPoint[]; readonly color: string };
