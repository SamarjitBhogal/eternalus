import type { WorldPoint } from '../engine/render/Renderer.types';

/** The gem's burst as the eruption view draws it: where, and how far through (0 to 1). */
export type EruptionBurst = { readonly at: WorldPoint; readonly progress: number };
