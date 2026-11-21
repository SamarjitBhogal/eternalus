import type { Renderer } from '../engine/render/Renderer';
import { DefaultEntityView } from './DefaultEntityView';
import type { EntityDrawState } from './EntityView.types';
import { STRUCTURE_AURA_RING_ALPHA, STRUCTURE_MARKERS } from './entityViews.constants';

/**
 * The structures' view. A lane tower draws its kind's marker in its team's colour, on the entity
 * layer above the fort's court, so a spawner tower and a buff tower look different (DEC-315). A
 * living structure with an aura (`EntitySnapshot.auraRadius`, from its definition) also draws a
 * thin, faint ring of that radius in its team's colour (DEC-315 (4)). A fallen structure has no
 * entity, no marker and no ring. The other structures, and every structure's mini
 * map glyph, stay with `MapView`, which paints them from the map's features.
 */
export class StructureView extends DefaultEntityView {
  /**
   * Draws the aura ring, then the kind's marker, while the structure stands; nothing for a kind
   * without either.
   */
  public override draw({ entity, position }: EntityDrawState, renderer: Renderer): void {
    const marker = STRUCTURE_MARKERS[entity.kind];
    if (marker === undefined || (entity.health !== null && entity.health.current <= 0)) return;
    const color = this.colorOf(entity.team);
    if (entity.auraRadius !== undefined) {
      renderer.drawWorldGlyph(
        { shape: 'ring', size: entity.auraRadius * 2 },
        position,
        `${color}${STRUCTURE_AURA_RING_ALPHA}`,
      );
    }
    renderer.drawWorldGlyph(marker, position, color);
  }

  /** Draws nothing; `MapView.drawMinimap` marks every structure feature. */
  public override drawMinimap(): void {
    // Intentionally empty: the map layer owns structure glyphs on the mini map.
  }
}
