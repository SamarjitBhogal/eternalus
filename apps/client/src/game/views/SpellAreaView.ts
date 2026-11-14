import type { Renderer } from '../engine/render/Renderer';
import type { EntityDrawState, EntityView } from './EntityView.types';

/** Ground sigils remain in the world and pulse on presentation time, independent of game rules. */
export class SpellAreaView implements EntityView {
  /** Time is supplied by the match's interpolated tick, never by a browser timer. */
  public constructor(private readonly seconds: () => number) {}
  /** Layers a translucent floor, rotating runes and concentric rings inside the authored radius. */
  public draw({ entity, position }: EntityDrawState, renderer: Renderer): void {
    const zone = entity.spellZone;
    if (zone === undefined) return;
    for (const polygon of entity.area ?? []) renderer.fillPolygon(polygon, '#c6e8ff16');
    const diameter = zone.radius * 2;
    renderer.drawWorldGlyph({ shape: 'ring', size: diameter }, position, '#f4e6a999');
    renderer.drawWorldGlyph(
      { shape: 'ring', size: diameter * (0.8 + Math.sin(this.seconds() * 2) * 0.03) },
      position,
      '#a7ebff88',
    );
    for (let rune = 0; rune < 8; rune += 1) {
      const angle = (rune / 8) * Math.PI * 2 + this.seconds() * 0.15;
      renderer.drawWorldGlyph(
        { shape: 'diamond', size: 0.25 },
        {
          x: position.x + Math.cos(angle) * zone.radius * 0.88,
          y: position.y + Math.sin(angle) * zone.radius * 0.88,
        },
        '#fff5ce',
      );
    }
  }
  /** Transient spell circles do not occupy objective minimap markers. */
  public drawMinimap(): void {
    // Intentionally omitted: spell areas are not capture objectives.
  }
}
