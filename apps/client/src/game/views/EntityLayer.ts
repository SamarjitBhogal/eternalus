import type { EntitySnapshot, Snapshot } from '@eternalus/core';

import type { Renderer } from '../engine/render/Renderer';
import type { WorldPoint } from '../engine/render/Renderer.types';
import type { EntityDrawState } from './EntityView.types';
import {
  HEALTH_BAR_FILL_COLOR,
  HEALTH_BAR_GAP,
  HEALTH_BAR_HEIGHT,
  HEALTH_BAR_TRACK_COLOR,
  HEALTH_BAR_WIDTH_SCALE,
} from './entityViews.constants';
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

  /**
   * Creates the layer over a view registry. `isDead` is the one dead rule (DEC-151 (2)), injected
   * by `Match`, because views import nothing from `bridge/`. `hasHealthBar` is the world health
   * bar rule (`HealthBarVisibility`), injected because it reads the simulation's events.
   */
  public constructor(
    private readonly views: ViewRegistry,
    private readonly isDead: (health: EntitySnapshot['health']) => boolean,
    private readonly hasHealthBar: (entity: EntitySnapshot) => boolean,
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
   * Draws every entity, back to front by `y`, so lower entities overlap higher ones. The health
   * bars come after all the entities, so no entity hides a bar.
   */
  public draw(renderer: Renderer): void {
    const ordered = [...this.states].sort((a, b) => a.position.y - b.position.y);
    for (const state of ordered) {
      this.views.viewFor(state.entity).draw(state, renderer);
    }
    for (const state of ordered) {
      if (this.hasHealthBar(state.entity)) {
        EntityLayer.drawHealthBar(state, renderer);
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

  /**
   * Draws a bar centred over the unit: the track, then the health left, filled from the left
   * (`health.current / health.max`).
   */
  private static drawHealthBar({ entity, position }: EntityDrawState, renderer: Renderer): void {
    const { health, transform } = entity;
    if (health === null || transform === null) {
      return;
    }
    const width = transform.radius * 2 * HEALTH_BAR_WIDTH_SCALE;
    const x = position.x - width / 2;
    const y = position.y - transform.radius - HEALTH_BAR_GAP - HEALTH_BAR_HEIGHT;
    EntityLayer.fillBar(renderer, { x, y }, width, HEALTH_BAR_TRACK_COLOR);
    EntityLayer.fillBar(
      renderer,
      { x, y },
      (width * health.current) / health.max,
      HEALTH_BAR_FILL_COLOR,
    );
  }

  /** Fills a bar `HEALTH_BAR_HEIGHT` high and `width` wide from its top-left corner `at`. */
  private static fillBar(renderer: Renderer, at: WorldPoint, width: number, color: string): void {
    const bottom = at.y + HEALTH_BAR_HEIGHT;
    renderer.fillPolygon(
      [
        { x: at.x, y: at.y },
        { x: at.x + width, y: at.y },
        { x: at.x + width, y: bottom },
        { x: at.x, y: bottom },
      ],
      color,
    );
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
