import type { AtlasGrid, SpriteRef } from './Renderer.types';

/**
 * The one rule behind `Renderer.hasSprite`, shared by `Canvas2dRenderer` and `RecordingRenderer`:
 * returns the atlas `sprite` names when `sprite.frame` is a whole cell index inside its grid, else
 * `undefined`.
 */
export function atlasWithFrame<T extends AtlasGrid>(
  atlases: Readonly<Record<string, T>>,
  sprite: SpriteRef,
): T | undefined {
  const atlas = atlases[sprite.atlasId];
  const isInGrid =
    atlas !== undefined &&
    Number.isInteger(sprite.frame) &&
    sprite.frame >= 0 &&
    sprite.frame < atlas.columns * atlas.rows;
  return isInGrid ? atlas : undefined;
}
