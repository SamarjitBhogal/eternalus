import type { Renderer } from '../engine/render/Renderer';
import type { EntityDrawState } from './EntityView.types';
import { MobView } from './MobView';
import { MinionFigureBuilder } from './MinionFigureBuilder';
import { MINION_ART_SCALE, MINION_PALETTES } from './MinionView.constants';
import type { MinionPart, MinionWeight } from './MinionView.types';
import { FOCUS_RING_COLOR, FOCUS_RING_SCALE } from './entityViews.constants';

/** Draws cached fantasy minion figures over the existing readable faction footprint. */
export class MinionView extends MobView {
  private readonly transformed = new Map<string, readonly MinionPart[]>();
  private readonly vertices = new WeakMap<
    EntityDrawState['entity'],
    { shape: { x: number; y: number }[]; color: string }[]
  >();
  private readonly extentByTeam = new Map<string, number>();
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
    for (const [team, figure] of this.figures) {
      this.extentByTeam.set(
        team,
        Math.max(0, ...figure.flatMap((part) => part.shape.map(({ x, y }) => Math.hypot(x, y)))),
      );
    }
  }

  /** Returns a radius that encloses the cached figure for this faction. */
  public override visualRadiusOf(entity: EntityDrawState['entity']): number {
    const team = entity.team ?? 'neutral';
    const extent = this.extentByTeam.get(team) ?? 0;
    return Math.max(super.visualRadiusOf(entity), extent * this.figureScale(entity));
  }

  private figureScale(entity: EntityDrawState['entity']): number {
    return (entity.transform?.radius ?? 0) * MINION_ART_SCALE;
  }

  /** Draws at the interpolated position; the snapshot and physical footprint are never modified. */
  public override draw(state: EntityDrawState, renderer: Renderer): number | undefined {
    super.draw({ ...state, isFocused: false }, renderer);
    const radius = state.entity.transform?.radius ?? 0;
    if (radius <= 0) return undefined;
    const scale = this.figureScale(state.entity);
    const team = state.entity.team ?? 'neutral';
    const key = team + ':' + String(scale);
    let figure = this.transformed.get(key);
    if (figure === undefined) {
      const flip = team === 'dark' ? -1 : 1;
      figure = (this.figures.get(team) ?? []).map((part) => ({
        ...part,
        shape: part.shape.map((point) => ({ x: point.x * scale * flip, y: point.y * scale })),
      }));
      this.transformed.set(key, figure);
    }
    let world = this.vertices.get(state.entity);
    if (world === undefined) {
      world = figure.map((part) => ({
        color: part.color,
        shape: part.shape.map((point) => ({ ...point })),
      }));
      this.vertices.set(state.entity, world);
    }
    figure.forEach((part, index) => {
      const target = world[index];
      if (target === undefined) return;
      part.shape.forEach((point, vertex) => {
        const output = target.shape[vertex];
        if (output !== undefined) {
          output.x = state.position.x + point.x;
          output.y = state.position.y + point.y;
        }
      });
      renderer.fillPolygon(target.shape, part.color);
    });
    if (state.isFocused)
      renderer.drawWorldGlyph(
        { shape: 'ring', size: radius * 2 * FOCUS_RING_SCALE },
        state.position,
        FOCUS_RING_COLOR,
      );
    return undefined;
  }
}
