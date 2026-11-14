import { Transform } from '../components/Transform';
import type { MapObject } from '../content/maps/mapObjects.types';
import type { ObstacleDefinition } from '../content/obstacles/obstacles.types';
import type { Vec2 } from '../utils/geometry.types';
import type { MutableVec2 } from '../utils/vec2.types';
import { nearestPointOnPolygons } from '../utils/geometry';
import type { EntityStore } from './EntityStore';
import type { WorldObjectStore } from './WorldObjectStore';

/**
 * What a dead lane tower's fort becomes (DEC-217 (12), DEC-219 (a)): the tower's own objects and
 * the one fort wall that took the killing hit fall with it; every other wall stands as scenery,
 * with no team and a health pool of its own (`ruinWall`'s), until it is destroyed itself.
 *
 * `WorldObjectStore` keeps the identity of the objects; this class holds the rule. The struck
 * wall is an estimate from where the killer stands, as `DamageSource` carries no hit point.
 * `MapDestructionSystem` calls it from its `entity-died` and `entity-removed` listeners.
 */
export class StructureRuins {
  /** A dead structure's id → the id of its fort wall that took the killing hit; none if absent. */
  private readonly hits = new Map<string, string>();
  /** The structures whose bodies are retired, so a second `removed` changes nothing. */
  private readonly retired = new Set<string>();
  private readonly aim: MutableVec2 = { x: 0, y: 0 };

  /**
   * @param objects - The placed objects, whose bodies this retires.
   * @param entities - Where an attacker's position is read.
   * @param ruinWall - What each standing wall becomes; its id must be known to the entity factory.
   */
  public constructor(
    private readonly objects: WorldObjectStore,
    private readonly entities: EntityStore,
    private readonly ruinWall: ObstacleDefinition,
  ) {}

  /**
   * Notes where the hit that killed `entityId` landed, from where `attackerId` stands: on the fort
   * wall of the structure's body nearest it, when no other part of the body is nearer (attack
   * reach is measured to that nearest point, `EntityStore.aimPointOf`), else on the structure
   * itself. With no attacker or no position for it, on the structure itself. Does nothing for an
   * entity that is no structure's body. Call it when the structure dies (`entity-died`).
   */
  public died(entityId: string, attackerId: string | null): void {
    const body = this.objects.bodyOf(entityId);
    if (body.length === 0) return;
    const from = this.entities.get(attackerId ?? '')?.findComponent(Transform)?.position;
    const wall = from === undefined ? undefined : this.wallHitFrom(body, from);
    if (wall !== undefined) this.hits.set(entityId, wall.id);
  }

  /**
   * The map objects that fall when `entityId` is retired, in record order: an obstacle's own
   * object; for a structure, its own objects and the fort wall that took the killing hit (`died`),
   * which falls with it (DEC-217 (12)). The same before and after `removed`.
   */
  public fallen(entityId: string): readonly MapObject[] {
    const own = this.objects.objectFor(entityId);
    if (own !== undefined) return [own];
    const hit = this.hits.get(entityId);
    return this.objects
      .bodyOf(entityId)
      .filter((object) => object.partOf === undefined || object.id === hit);
  }

  /**
   * Retires a structure's body: its fallen objects (`fallen`) are destroyed and each other wall
   * stands alone as `ruinWall` (DEC-219 (a)). Does nothing for an entity that is no structure's
   * body. Call it when the structure is retired (`entity-removed`).
   */
  public removed(entityId: string): void {
    const body = this.objects.bodyOf(entityId);
    if (body.length === 0 || this.retired.has(entityId)) return;
    this.retired.add(entityId);
    const fallen = new Set(this.fallen(entityId));
    for (const object of body) {
      if (fallen.has(object)) this.objects.destroy(object);
      else this.objects.standAlone(object, this.ruinWall);
    }
  }

  /**
   * The fort wall of `body` nearest `from`, lower index on a tie, or `undefined` when a part of
   * the body that is no wall (the keep) is nearer.
   */
  private wallHitFrom(body: readonly MapObject[], from: Vec2): MapObject | undefined {
    let wall: MapObject | undefined;
    let wallGap = Number.POSITIVE_INFINITY;
    let ownGap = Number.POSITIVE_INFINITY;
    for (const object of body) {
      const gap = nearestPointOnPolygons(from, object.footprints, this.aim);
      if (object.partOf === undefined) ownGap = Math.min(ownGap, gap);
      else if (gap < wallGap) [wall, wallGap] = [object, gap];
    }
    return wallGap <= ownGap ? wall : undefined;
  }
}
