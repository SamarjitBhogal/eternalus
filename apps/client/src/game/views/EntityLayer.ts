import type { EntitySnapshot, Snapshot } from '@eternalus/core';

import type { Renderer } from '../engine/render/Renderer';
import type { WorldPoint } from '../engine/render/Renderer.types';
import type { EntityDrawState } from './EntityView.types';
import type { WorldLayer } from './SceneView.types';
import type { ViewRegistry } from './ViewRegistry';

/**
 * The scene layer that draws every entity of the latest snapshot through the `ViewRegistry`
 * (architecture 08 §8). Positions are interpolated between the previous and current snapshot by
 * `alpha`; an entity that appeared this tick draws where it is (no ghost from the origin). It
 * draws back to front by `y`.
 */
export class EntityLayer implements WorldLayer {
  private states: readonly EntityDrawState[] = [];

  /** Creates the layer over a view registry. */
  public constructor(private readonly views: ViewRegistry) {}

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
      const position = EntityLayer.positionOf(entity, before.get(entity.id), alpha);
      return position === null ? [] : [{ entity, position, isFocused: entity.id === focusId }];
    });
  }

  /** Draws every entity, back to front by `y`, so lower entities overlap higher ones. */
  public draw(renderer: Renderer): void {
    const ordered = [...this.states].sort((a, b) => a.position.y - b.position.y);
    for (const state of ordered) {
      this.views.viewFor(state.entity).draw(state, renderer);
    }
  }

  /** Draws nothing: entity markers on the minimap belong to the minimap work (SCRUM-151). */
  public drawMinimap(): void {
    // Intentionally empty; WorldLayer requires the method.
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
