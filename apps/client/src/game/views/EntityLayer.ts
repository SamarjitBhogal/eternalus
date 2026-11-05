import type { EntitySnapshot, Snapshot } from '@eternalus/core';

import type { Renderer } from '../engine/render/Renderer';
import type { WorldPoint } from '../engine/render/Renderer.types';
import type { EntityDrawState } from './EntityView.types';
import type { WorldLayer } from './SceneView.types';
import type { ViewRegistry } from './ViewRegistry';

/**
 * The scene layer that draws every entity of the latest snapshot through the `ViewRegistry`
 * (architecture 08 §8), in the main view and on the mini map (06 §8). Positions and facings are
 * interpolated between the previous and current snapshot by `alpha`; an entity that appeared this
 * tick draws where it is (no ghost from the origin). It draws back to front by `y`.
 */
export class EntityLayer implements WorldLayer {
  private states: readonly EntityDrawState[] = [];

  /**
   * Creates the layer over a view registry. `isDead` is the one dead rule (DEC-151 (2)), injected
   * by `Match`, because views import nothing from `bridge/`.
   */
  public constructor(
    private readonly views: ViewRegistry,
    private readonly isDead: (health: EntitySnapshot['health']) => boolean = () => false,
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
      const then = before.get(entity.id)?.transform ?? now;
      const position = EntityLayer.lerp(then, now, alpha);
      const facing = EntityLayer.turn(then.facing, now.facing, alpha);
      return [{ entity, position, facing, isFocused: entity.id === focusId }];
    });
  }

  /** Draws every entity, back to front by `y`, so lower entities overlap higher ones. */
  public draw(renderer: Renderer): void {
    const ordered = [...this.states].sort((a, b) => a.position.y - b.position.y);
    for (const state of ordered) {
      this.views.viewFor(state.entity).draw(state, renderer);
    }
  }

  /**
   * Draws each living entity's mini map marker through its view, except the player's own (the
   * mini map's centre marker is the player, DEC-187). Views on a higher `minimapLayer` draw last.
   */
  public drawMinimap(renderer: Renderer): void {
    const marked = this.states
      .filter((state) => !state.isFocused && !this.isDead(state.entity.health))
      .map((state) => ({ state, view: this.views.viewFor(state.entity) }))
      .sort((a, b) => (a.view.minimapLayer ?? 0) - (b.view.minimapLayer ?? 0));
    for (const { state, view } of marked) {
      view.drawMinimap(state, renderer);
    }
  }

  private static lerp(from: WorldPoint, to: WorldPoint, alpha: number): WorldPoint {
    return { x: from.x + (to.x - from.x) * alpha, y: from.y + (to.y - from.y) * alpha };
  }

  /** The facing `alpha` of the way from `from` to `to`, kept a unit vector; `to` when opposite. */
  private static turn(from: WorldPoint, to: WorldPoint, alpha: number): WorldPoint {
    const { x, y } = EntityLayer.lerp(from, to, alpha);
    const size = Math.hypot(x, y);
    return size === 0 ? to : { x: x / size, y: y / size };
  }
}
