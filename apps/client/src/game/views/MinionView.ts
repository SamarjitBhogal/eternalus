import type { Renderer } from '../engine/render/Renderer';
import type { EntityDrawState } from './EntityView.types';
import { MobView } from './MobView';
import { MinionFigureBuilder } from './MinionFigureBuilder';
import { MINION_ART_SCALE, MINION_PALETTES } from './MinionView.constants';
import type { MinionPart, MinionWeight } from './MinionView.types';
import { FOCUS_RING_COLOR, FOCUS_RING_SCALE } from './entityViews.constants';

/** Draws cached fantasy minion figures over the existing readable faction footprint. */
export class MinionView extends MobView {
  private readonly figures: ReadonlyMap<string, readonly MinionPart[]>;

  /** Selects a weight silhouette once; each faction's local artwork is assembled only once. */
  public constructor(weight: MinionWeight) {
    super();
    this.figures = new Map(
      Object.entries(MINION_PALETTES).map(([team, palette]) => [
        team,
        new MinionFigureBuilder().build(weight, palette),
      ]),
    );
  }

  /** Draws at the interpolated position; the snapshot and physical footprint are never modified. */
  public override draw(state: EntityDrawState, renderer: Renderer): void {
    super.draw({ ...state, isFocused: false }, renderer);
    const radius = state.entity.transform?.radius ?? 0;
    if (radius <= 0) return;
    const scale = radius * MINION_ART_SCALE;
    const figure = this.figures.get(state.entity.team ?? 'neutral') ?? [];
    const flip = state.entity.team === 'dark' ? -1 : 1;
    for (const part of figure) {
      renderer.fillPolygon(
        part.shape.map((point) => ({
          x: state.position.x + point.x * scale * flip,
          y: state.position.y + point.y * scale,
        })),
        part.color,
      );
    }
    if (state.isFocused)
      renderer.drawWorldGlyph(
        { shape: 'ring', size: radius * 2 * FOCUS_RING_SCALE },
        state.position,
        FOCUS_RING_COLOR,
      );
  }
}
