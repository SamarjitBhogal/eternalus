import type { Renderer } from '../engine/render/Renderer';
import type { EntityDrawState, EntityView } from './EntityView.types';
import { ABILITY_ART as A } from './AbilityFieldView.constants';
import { ABILITY_FIELD_STYLES } from './AbilityFieldView.constants';

/** Draws the actual persistent area polygons of Sanctuary and Death Ray. */
export class AbilityFieldView implements EntityView {
  /** Time is injected from the match's interpolated tick, never a second clock. */
  public constructor(private readonly seconds: () => number) {}
  /** Renders a geometric field with orbiting motes or travelling beam bands. */
  public draw({ entity, position }: EntityDrawState, renderer: Renderer): void {
    const time = this.seconds();
    const style = ABILITY_FIELD_STYLES[entity.definitionId];
    if (style === undefined) return;
    const { isHealing } = style;
    const color = entity.team === 'dark' ? A.dark : A.light;
    for (const polygon of entity.area ?? []) {
      const first = polygon[0];
      if (first === undefined) continue;
      renderer.fillPolygon(polygon, isHealing ? A.healingFill : A.beamFill);
      renderer.strokePath([...polygon, first], isHealing ? A.healingEdge : color, A.outline);
      if (isHealing) {
        const radius = Math.hypot(first.x - position.x, first.y - position.y);
        for (let i = 0; i < A.particles; i++) {
          const angle = (i * Math.PI * 2) / A.particles + time * A.rotationRate;
          renderer.drawWorldGlyph(
            { shape: 'diamond', size: A.moteSize },
            { x: position.x + Math.cos(angle) * radius, y: position.y + Math.sin(angle) * radius },
            A.healingCore,
          );
        }
      } else {
        const [p0, p1, p2, p3] = polygon;
        if (p0 === undefined || p1 === undefined || p2 === undefined || p3 === undefined) continue;
        const from = { x: (p0.x + p3.x) / 2, y: (p0.y + p3.y) / 2 };
        const to = { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 };
        renderer.strokePath([from, to], A.beamCore, A.coreWidth);
        for (let i = 0; i < A.beamBands; i++) {
          const along = (i / A.beamBands + time * A.rotationRate) % 1;
          renderer.drawWorldGlyph(
            { shape: 'diamond', size: A.moteSize * (1 + Math.sin(time * A.pulseRate) / 2) },
            { x: from.x + (to.x - from.x) * along, y: from.y + (to.y - from.y) * along },
            color,
          );
        }
      }
    }
  }
  /** Transient spell areas do not add objective/minion dots to the minimap. */
  public drawMinimap(): void {
    return;
  }
}
