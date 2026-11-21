import type { EntitySnapshot, Snapshot, Team } from '@eternalus/core';

import type { Renderer } from '../engine/render/Renderer';
import type { WorldPoint } from '../engine/render/Renderer.types';
import type { HealthBarRule } from './EntityLayer.types';
import type { EntityDrawState } from './EntityView.types';
import { HIDDEN_UNIT_OPACITY } from './entityViews.constants';
import { HealthBarView } from './HealthBarView';
import type { WorldLayer } from './SceneView.types';
import type { StatusCueRegistry } from './StatusCueRegistry';
import type { ViewRegistry } from './ViewRegistry';

/**
 * The scene layer that draws every entity of the latest snapshot through the `ViewRegistry`
 * (architecture 08 §8), in the main view and on the mini map (06 §8). In the main view positions
 * and facings are interpolated between the previous and current snapshot by `alpha`; an entity
 * that appeared this tick draws where it is (no ghost from the origin). It draws back to front by
 * `y`. A mini map dot sits at the snapshot position (DEC-187 (C)). A hidden (Veiled) enemy of the
 * viewer is not drawn at all: no body, cue, health bar or mini map dot; a hidden unit of the
 * viewer's side is drawn faded (DEC-266).
 */
export class EntityLayer implements WorldLayer {
  private states: readonly EntityDrawState[] = [];

  private readonly healthBars = new HealthBarView();

  /**
   * Creates the layer over a view registry and a status cue registry. `isDead` is the one dead rule
   * (DEC-151 (2)), injected by `Match`, because views import nothing from `bridge/`. `healthBarOf`
   * is the world health bar rule (`HealthBarVisibility`, DEC-195), injected because it reads the
   * simulation's events.
   */
  public constructor(
    private readonly views: ViewRegistry,
    private readonly cues: StatusCueRegistry,
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
   * @param viewerTeam - The player's team, whose hidden units draw faded; every other team's
   *   hidden units are left out. `null` (sim mode) draws every hidden unit faded.
   */
  public show(
    previous: Snapshot | null,
    current: Snapshot,
    alpha: number,
    focusId: string | null,
    viewerTeam: Team | null,
  ): void {
    const before = new Map(previous?.entities.map((entity) => [entity.id, entity]) ?? []);
    this.states = current.entities.flatMap((entity) => {
      const now = entity.transform;
      const isHiddenFromViewer =
        entity.isHidden === true && viewerTeam !== null && entity.team !== viewerTeam;
      if (entity.mapObjectId !== undefined || now === null || isHiddenFromViewer) return [];
      const then = before.get(entity.id)?.transform ?? now;
      const position = EntityLayer.lerp(then, now, alpha);
      const facing = EntityLayer.turn(then.facing, now.facing, alpha);
      return [{ entity, position, facing, isFocused: entity.id === focusId }];
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
   * Draws every entity, back to front by `y`, so lower entities overlap higher ones. The status
   * cues (each status's view in the `StatusCueRegistry`, such as the wind-up rings of DEC-283) and
   * then the health bars (`HealthBarView`) come after every entity of this layer, so no entity
   * hides them. A hidden unit still shown (the viewer's side) draws its body faded.
   */
  public draw(renderer: Renderer): void {
    const ordered = [...this.states].sort((a, b) => a.position.y - b.position.y);
    for (const state of ordered) {
      const view = this.views.viewFor(state.entity);
      if (state.entity.isHidden === true) {
        renderer.withOpacity(HIDDEN_UNIT_OPACITY, () => {
          view.draw(state, renderer);
        });
      } else {
        view.draw(state, renderer);
      }
    }
    for (const state of ordered) {
      const { statuses } = state.entity;
      if (statuses !== null) {
        for (const status of statuses) {
          this.cues.viewFor(status.id)?.draw(state, status, renderer);
        }
      }
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

  private static lerp(from: WorldPoint, to: WorldPoint, alpha: number): WorldPoint {
    return { x: from.x + (to.x - from.x) * alpha, y: from.y + (to.y - from.y) * alpha };
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
