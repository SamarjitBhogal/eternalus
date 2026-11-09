import type { WorldPoint } from '../engine/render/Renderer.types';

/** Decoded atlas supplied by the composition root. */
export type KnightAtlas = {
  readonly image: CanvasImageSource;
  readonly width: number;
  readonly height: number;
};
/** View-only frame sample. */
export type KnightPose = {
  readonly row: number;
  readonly frame: number;
  readonly position: WorldPoint | null;
};
/** Cosmetic clips, without simulation ability effects. */
export type KnightAction = 'attack' | 'ability-1' | 'ability-2' | 'ability-3' | 'ability-4';
