import { Collider } from '../components/Collider';
import { Footprint } from '../components/Footprint';
import { Movement } from '../components/Movement';
import { TeamMembership } from '../components/TeamMembership';
import { Transform } from '../components/Transform';
import type { EntityId } from '../state/EntityStore.types';
import type { GameState } from '../state/GameState';
import type { SummonPlacement, Summoner } from '../state/Summoner.types';
import { circlePenetration } from '../utils/circlePolygon';
import { CONTACT_EPSILON } from '../utils/circlePolygon.constants';
import type { Polygon } from '../utils/geometry.types';
import type { EntityFactory } from './EntityFactory';

/**
 * Puts a summoned body into the match through the match's one `EntityFactory` (architecture 05 §3
 * `summon`): the definition at the placement, facing its way, added to the store and announced
 * (`entity-spawned`, on its team or `neutral`). A body with a solid outline (`Footprint`, not
 * walk-on: a Shield Wall) becomes a wall at once (`GameState.walls`), and every unit its outline
 * overlaps is pushed straight out of it, by the walls' own rule (`GameState.collisions.reach`), so
 * no unit starts a move inside a wall (`CollisionResolver`'s precondition). A push that another
 * wall or the map's edge cuts short leaves the unit where it stops; it can still walk out.
 * `despawn` takes a body out as `despawned`; the wall goes with it (`Simulation` removes a placed
 * wall at every `entity-removed`).
 */
export class EntitySummoner implements Summoner {
  /** @param factory - The match's one factory, which knows the summonable definitions. */
  public constructor(private readonly factory: Pick<EntityFactory, 'create' | 'definitions'>) {}

  /**
   * Builds, places, adds and announces the body, and makes a solid outline a wall.
   *
   * @throws Error when the factory knows no definition `definitionId` (`SummonEffect.validate`
   *   checks every id an ability names at boot, so this is a factory given other content).
   */
  public summon(state: GameState, definitionId: string, placement: SummonPlacement): EntityId {
    const { kind } = this.factory.definitions.get(definitionId);
    const body = this.factory.create(kind, definitionId, placement);
    state.entities.add(body);
    const outline = body.findComponent(Footprint);
    if (outline !== undefined && !outline.isWalkOn && state.walls !== null) {
      state.walls.add(body.id, outline.polygons);
      EntitySummoner.pushOut(state, outline.polygons);
    }
    const team = body.findComponent(TeamMembership)?.team ?? 'neutral';
    state.events.emit('entity-spawned', { entityId: body.id, kind, team });
    return body.id;
  }

  /** Takes the body `entityId` out of the match as `despawned` and announces it. */
  public despawn(state: GameState, entityId: EntityId): void {
    state.entities.remove(entityId, 'despawned');
    state.events.emit('entity-removed', { entityId, cause: 'despawned' });
  }

  /**
   * Moves every unit `CollisionSystem` moves (a mover with an enabled, non-static collider that is
   * not a shot) out of `polygons`, along the shortest way out, by as much as it overlaps.
   */
  private static pushOut(state: GameState, polygons: readonly Polygon[]): void {
    const { collisions } = state;
    if (collisions === null) return;
    state.entities.forEach((entity) => {
      const transform = entity.findComponent(Transform);
      const collider = entity.findComponent(Collider);
      if (
        transform === undefined ||
        !entity.hasComponent(Movement) ||
        collider?.isEnabled !== true ||
        collider.isStatic ||
        collider.layer === 'projectile'
      )
        return;
      for (const polygon of polygons) {
        const { position, radius } = transform;
        const { depth, normal } = circlePenetration(position, radius, polygon);
        if (depth <= 0 || (normal.x === 0 && normal.y === 0)) continue;
        const way = collisions.reach(position, normal, depth + CONTACT_EPSILON, radius);
        transform.moveTo({ x: position.x + normal.x * way, y: position.y + normal.y * way });
      }
    });
  }
}
