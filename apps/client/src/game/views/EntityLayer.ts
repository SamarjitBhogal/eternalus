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
 * (architecture 08 §8), in the main view and on the mini map (06 §8). In the main view positions
 * are interpolated between the previous and current snapshot by `alpha`; an entity that appeared
 * this tick draws where it is (no ghost from the origin). It draws back to front by `y`. A mini map
 * dot sits at the snapshot position (DEC-187 (C)).
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
      if (entity.mapObjectId !== undefined) return [];
      const position = EntityLayer.positionOf(entity, before.get(entity.id), alpha);
      return position === null ? [] : [{ entity, position, isFocused: entity.id === focusId }];
    });
  }

  /**
   * Where `id` is drawn in the main view since the last `show` (its interpolated position), so
   * what is drawn around a unit sits on it; `null` when the layer does not draw it.
   */
  public drawnAt(id: string | null): WorldPoint | null {
    return this.states.find(({ entity }) => entity.id === id)?.position ?? null;
  }

  /**
   * Draws every entity, back to front by `y`, so lower entities overlap higher ones. The health
   * bars (`HealthBarView`) come after every entity of this layer, so no entity hides a bar.
   */
  public draw(renderer: Renderer): void {
    const ordered = [...this.states].sort((a, b) => a.position.y - b.position.y);
    for (const state of ordered) {
      this.views.viewFor(state.entity).draw(state, renderer);
    }
    for (const state of ordered) {
      const side = this.healthBarOf(state.entity);
      if (side !== null) {
        this.healthBars.draw(state, side, renderer);
      }
    }
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

  private static positionOf(
    entity: EntitySnapshot,
    before: EntitySnapshot | undefined,
    alpha: number,
  ): WorldPoint | null {
    const now = entity.transform;
    if (now === null) {
      return null;
    }
    const then = before?.transform ?? now;
    return { x: then.x + (now.x - then.x) * alpha, y: then.y + (now.y - then.y) * alpha };
  }
}
