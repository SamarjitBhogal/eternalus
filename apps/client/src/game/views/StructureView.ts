import type { Renderer } from '../engine/render/Renderer';
import { DefaultEntityView } from './DefaultEntityView';
import type { EntityDrawState } from './EntityView.types';
import { STRUCTURE_MARKERS } from './entityViews.constants';

/**
 * The structures' view. A lane tower draws its kind's marker in its team's colour, on the entity
 * layer above the fort's court, so a spawner tower and a buff tower look different (DEC-315). A
 * fallen structure has no entity and no marker. The other structures, and every structure's mini
 * map glyph, stay with `MapView`, which paints them from the map's features.
 */
export class StructureView extends DefaultEntityView {
  /** Draws the kind's marker while the structure stands; nothing for a kind without one. */
  public override draw({ entity, position }: EntityDrawState, renderer: Renderer): void {
    const marker = STRUCTURE_MARKERS[entity.kind];
    if (marker === undefined || (entity.health !== null && entity.health.current <= 0)) return;
    renderer.drawWorldGlyph(marker, position, this.colorOf(entity.team));
  }

  /** Draws nothing; `MapView.drawMinimap` marks every structure feature. */
  public override drawMinimap(): void {
    // Intentionally empty: the map layer owns structure glyphs on the mini map.
  }
}
