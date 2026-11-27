import { Footprint } from '../components/Footprint';
import { Summoned } from '../components/Summoned';
import { TeamMembership } from '../components/TeamMembership';
import { Transform } from '../components/Transform';
import type { EntityId } from '../state/EntityStore.types';
import type { GameState } from '../state/GameState';
import type { SummonPlacement, SummonResult, Summoner } from '../state/Summoner.types';
import { doesCircleOverlapPolygon } from '../utils/circlePolygon';
import type { Polygon } from '../utils/geometry.types';
import type { EntityFactory } from './EntityFactory';
import { isCollisionMover } from './isCollisionMover';

/**
 * Puts a summoned body into the match through the match's one `EntityFactory` (architecture 05 §3
 * `summon`): the definition at the placement, facing its way, with its owner (`Summoned`, added
 * before the body joins the store), added to the store and announced (`entity-spawned`, on its
 * team or `neutral`). A body with a solid outline (`Footprint`, not
 * walk-on: a Shield Wall) becomes a wall at once (`GameState.walls`), and every unit its outline
 * overlaps is pushed out of the walls by the match's one push-out rule
 * (`GameState.collisions.pushOut`, which `BodySizeSystem` also uses; DEC-363), so no unit starts a
 * move inside a wall (`CollisionResolver`'s precondition), with one exception. The push never
 * moves a unit into a map object or another wall, and it does not search for free ground (at
 * most four passes, each the shortest way out of the deepest wall). So a unit can stay partly
 * inside the new wall, also where there is room close by; it can still walk out. Such a unit is
 * pinned: `summon` returns it, and the cast deals it the impact damage (`SummonEffect`, DEC-382,
 * HC-B43 (6)).
 * `despawn` takes a body out as `despawned`; the wall goes with it (`Simulation` removes a placed
 * wall at every `entity-removed`).
 */
export class EntitySummoner implements Summoner {
  /** @param factory - The match's one factory, which knows the summonable definitions. */
  public constructor(private readonly factory: Pick<EntityFactory, 'create' | 'definitions'>) {}

  /**
   * Builds, places, owns, adds and announces the body, and makes a solid outline a wall. Returns
   * the body and the units the push left inside a wall.
   *
   * @throws Error when the factory knows no definition `definitionId` (`SummonEffect.validate`
   *   checks every id an ability names at boot, so this is a factory given other content).
   */
  public summon(
    state: GameState,
    definitionId: string,
    placement: SummonPlacement,
    ownerId: EntityId,
  ): SummonResult {
    const { kind } = this.factory.definitions.get(definitionId);
    const body = this.factory.create(kind, definitionId, placement);
    body.addComponent(new Summoned(ownerId));
    state.entities.add(body);
    const outline = body.findComponent(Footprint);
    let pinnedIds: readonly EntityId[] = [];
    if (outline !== undefined && !outline.isWalkOn && state.walls !== null) {
      state.walls.add(body.id, outline.polygons);
      pinnedIds = EntitySummoner.pushOut(state, outline.polygons);
    }
    const team = body.findComponent(TeamMembership)?.team ?? 'neutral';
    state.events.emit('entity-spawned', { entityId: body.id, kind, team });
    return { bodyId: body.id, pinnedIds };
  }

  /** Takes the body `entityId` out of the match as `despawned` and announces it. */
  public despawn(state: GameState, entityId: EntityId): void {
    state.entities.remove(entityId, 'despawned');
    state.events.emit('entity-removed', { entityId, cause: 'despawned' });
  }

  /**
   * Moves every unit walls stop (`isCollisionMover`) that overlaps `polygons` out of the walls, by
   * the match's one push-out rule (`GameState.collisions.pushOut`, DEC-363), and returns the ones
   * still without room there (`hasRoom`), in store order.
   */
  private static pushOut(state: GameState, polygons: readonly Polygon[]): readonly EntityId[] {
    const { collisions } = state;
    const pinned: EntityId[] = [];
    if (collisions === null) return pinned;
    state.entities.forEach((entity) => {
      const transform = entity.findComponent(Transform);
      if (transform === undefined || !isCollisionMover(entity)) return;
      const { position, radius } = transform;
      if (!polygons.some((polygon) => doesCircleOverlapPolygon(position, radius, polygon))) return;
      const to = collisions.pushOut(position, radius);
      transform.moveTo(to);
      if (!collisions.hasRoom(to, radius)) pinned.push(entity.id);
    });
    return pinned;
  }
}
