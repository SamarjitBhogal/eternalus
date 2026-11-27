import type { AtlasShape } from './Renderer.types';

/**
 * The height of a cell of `atlas` drawn `width` world units wide, in world units. The cell's shape
 * gives it, so a tall cell is not squashed.
 */
export function spriteHeight(atlas: AtlasShape, width: number): number {
  const cellWidth = atlas.image.width / atlas.columns;
  const cellHeight = atlas.image.height / atlas.rows;
  return (width * cellHeight) / cellWidth;
}

/**
 * How far the top of a cell of `atlas` drawn `width` world units wide stands above its feet (the
 * atlas's `groundOffset`), in world units. `Canvas2dRenderer` and `RecordingRenderer` share this
 * rule and `spriteHeight`.
 */
export function spriteTopOf(atlas: AtlasShape, width: number): number {
  return (1 - atlas.groundOffset) * spriteHeight(atlas, width);
}
