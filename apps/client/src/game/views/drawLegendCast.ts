import type { Renderer } from '../engine/render/Renderer';
import type { SpriteRef, WorldPoint } from '../engine/render/Renderer.types';
import { SPELL_PALETTES } from './spellPalettes';

/** Adds frame-driven fire motes, oracle rays or heretic orbits without changing spell rules. */
export function drawLegendCast(
  frame: SpriteRef,
  position: WorldPoint,
  size: number,
  renderer: Renderer,
): void {
  const palette = SPELL_PALETTES[frame.atlasId];
  if (palette === undefined || frame.frame < 36) return;
  const progress = ((frame.frame % 6) + 1) / 6;
  const radius = size * (0.2 + progress * 0.3);
  renderer.drawWorldGlyph({ shape: 'dot', size: radius * 2 }, position, palette.glow);
  renderer.drawWorldGlyph({ shape: 'ring', size: radius * 1.8 }, position, palette.core);
  for (let mote = 0; mote < 8; mote++) {
    const angle = (mote / 8 + progress * 0.2) * Math.PI * 2;
    const at = {
      x: position.x + Math.cos(angle) * radius,
      y: position.y + Math.sin(angle) * radius,
    };
    renderer.drawWorldGlyph({ shape: palette.shape, size: size * 0.04 }, at, palette.core);
    if (frame.atlasId === 'oracle-sprites') renderer.strokePath([position, at], palette.glow, 1);
  }
}
