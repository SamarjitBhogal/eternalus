import type { EntitySnapshot, Snapshot } from '@eternalus/core';

import type { Renderer } from '../engine/render/Renderer';
import type { WorldPoint } from '../engine/render/Renderer.types';
import type { HealthBarRule } from './EntityLayer.types';
import type { EntityDrawState } from './EntityView.types';
import { HealthBarView } from './HealthBarView';
import type { WorldLayer } from './SceneView.types';
import type { ViewRegistry } from './ViewRegistry';

/**
 * The scene layer that draws every entity of the latest snapshot through the `ViewRegistry`
 * (architecture 08 §8), in the main view and on the mini map (06 §8). In the main view positions,
 * facings and jump heights (DEC-390) are interpolated between the previous and current snapshot by
 * `alpha`; an entity that appeared this tick draws where it is (no ghost from the origin). It draws
 * back to front by `y`. A mini map dot sits at the snapshot position (DEC-187 (C)).
 */
export class EntityLayer implements WorldLayer {
  private states: readonly EntityDrawState[] = [];

  private readonly healthBars = new HealthBarView();

  /**
   * Creates the layer over a view registry. `isDead` is the one dead rule (DEC-151 (2)), injected
   * by `Match`, because views import nothing from `bridge/`. `healthBarOf` is the world health
   * bar rule (`HealthBarVisibility`, DEC-195), injected because it reads the simulation's events.
   */
  public constructor(
    private readonly views: ViewRegistry,
    private readonly isDead: (health: EntitySnapshot['health']) => boolean,
    private readonly healthBarOf: HealthBarRule,
  ) {}

  /**
   * Sets what the next draw shows.
   *
   * @param previous - The snapshot before `current`, or `null` on the first tick.
   * @param current - The latest snapshot.
   * @param alpha - How far between `previous` and `current` this frame is, in [0, 1).
   * @param focusId - The id of the entity the player controls, or `null`.
   */
  public show(
    previous: Snapshot | null,
    current: Snapshot,
    alpha: number,
    focusId: string | null,
  ): void {
    const before = new Map(previous?.entities.map((entity) => [entity.id, entity]) ?? []);
    this.states = current.entities.flatMap((entity) => {
      const now = entity.transform;
      if (entity.mapObjectId !== undefined || now === null) return [];
      const earlier = before.get(entity.id);
      const then = earlier?.transform ?? now;
      const position = EntityLayer.lerp(then, now, alpha);
      const facing = EntityLayer.turn(then.facing, now.facing, alpha);
      const height = EntityLayer.mix(
        EntityLayer.heightOf(earlier ?? entity),
        EntityLayer.heightOf(entity),
        alpha,
      );
      return [{ entity, position, facing, height, isFocused: entity.id === focusId }];
    });
  }

  /**
   * Draws every entity, back to front by `y`, so lower entities overlap higher ones. The health
   * bars (`HealthBarView`) come after every entity of this layer, so no entity hides a bar.
   */
  public draw(renderer: Renderer): void {
    const ordered = [...this.states].sort((a, b) => a.position.y - b.position.y);
    const heights = ordered.map((state) => this.views.viewFor(state.entity).draw(state, renderer));
    ordered.forEach((state, index) => {
      const side = this.healthBarOf(state.entity);
      if (side !== null) {
        // A sprite reports how tall it drew; any other view falls back to its artwork radius.
        const view = this.views.viewFor(state.entity);
        const above = heights[index] ?? view.visualRadiusOf?.(state.entity);
        this.healthBars.draw(state, side, renderer, above);
      }
    });
  }

  /**
   * Draws each living entity's mini map marker through its view at its snapshot position, not the
   * interpolated one (DEC-187 (C)), except the player's own (the mini map's centre marker is the
   * player, DEC-187). Views on a higher `minimapLayer` draw last.
   */
  public drawMinimap(renderer: Renderer): void {
    const marked = this.states
      .filter((state) => !state.isFocused && !this.isDead(state.entity.health))
      .map((state) => ({ state, view: this.views.viewFor(state.entity) }))
      .sort((a, b) => (a.view.minimapLayer ?? 0) - (b.view.minimapLayer ?? 0));
    for (const { state, view } of marked) {
      const at = state.entity.transform;
      if (at !== null) {
        view.drawMinimap({ ...state, position: { x: at.x, y: at.y } }, renderer);
      }
    }
  }

  private static lerp(from: WorldPoint, to: WorldPoint, alpha: number): WorldPoint {
    return { x: EntityLayer.mix(from.x, to.x, alpha), y: EntityLayer.mix(from.y, to.y, alpha) };
  }

  /** Height above the ground (a jump, DEC-390); 0 for an entity that cannot leave it. */
  private static heightOf(entity: EntitySnapshot): number {
    return entity.jump?.height ?? 0;
  }

  private static mix(from: number, to: number, alpha: number): number {
    return from + (to - from) * alpha;
  }

  /**
   * The facing `alpha` of the way from `from` to `to`, kept a unit vector. Opposite facings snap at
   * the midpoint (a zero blend takes `to`).
   */
  private static turn(from: WorldPoint, to: WorldPoint, alpha: number): WorldPoint {
    const { x, y } = EntityLayer.lerp(from, to, alpha);
    const size = Math.hypot(x, y);
    return size === 0 ? to : { x: x / size, y: y / size };
  }
}
