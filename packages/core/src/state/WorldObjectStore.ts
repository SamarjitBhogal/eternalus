import { Health } from '../components/Health';
import { MapObjectBody } from '../components/MapObjectBody';
import { TeamMembership } from '../components/TeamMembership';
import { Transform } from '../components/Transform';
import { RUINED_FORT_WALL_DEFINITION } from '../content/maps/mapObjectDefinitions';
import type { MapObject, MapObjectSnapshot } from '../content/maps/mapObjects.types';
import type { ObstacleDefinition } from '../content/obstacles/obstacles.types';
import type { EntityFactory } from '../entities/EntityFactory';
import type { EntityStore } from './EntityStore';
import type { WorldObjectRecord, WorldObjectStoreOptions } from './WorldObjectStore.types';
import type { Rect, Vec2 } from '../utils/geometry.types';
import type { MutableVec2 } from '../utils/vec2.types';
import { doesCircleOverlapPolygon, isCircleInsidePolygon } from '../utils/circlePolygon';
import { boundsOf, nearestPointOnPolygons } from '../utils/geometry';

/** Owns placed-object identity and persistent destroyed state after DeathSystem retires entities. */
export class WorldObjectStore {
  private readonly records: WorldObjectRecord[] = [];
  private readonly entityObjects = new Map<string, MapObject>();
  private readonly destroyed = new Set<string>();
  private readonly factory: EntityFactory;
  private readonly entities: EntityStore;
  private readonly ruinWall: ObstacleDefinition;

  /** A structure's id → the indexes of the records of the map objects that are its body. */
  private readonly bodies = new Map<string, readonly number[]>();

  /** The ids of the structures in `bodies` that still stand. */
  private readonly standing = new Set<string>();

  /** A dead structure's id → the record index of its fort wall that took the killing hit, or -1. */
  private readonly hits = new Map<string, number>();

  private readonly aim: MutableVec2 = { x: 0, y: 0 };

  /**
   * Spawns physical objects through the existing registry/factory; terrain has no health entity.
   * An object named in `owners` gets no entity of its own: it is part of its structure's body and
   * shares its one health pool (DEC-185 B: a lane tower's own object and its fort walls; only
   * towers, DEC-217 (13)), so a hit on it is a hit on the structure. The pool shows on the
   * structure's own object; a wall (`MapObject.partOf`) shows none.
   *
   * @param options - The objects, how to spawn them, and the structures some of them are bodies of.
   */
  public constructor({
    objects,
    factory,
    entities,
    definitions,
    owners = new Map(),
    ruinWall = RUINED_FORT_WALL_DEFINITION,
  }: WorldObjectStoreOptions) {
    this.factory = factory;
    this.entities = entities;
    this.ruinWall = ruinWall;
    for (const object of objects) {
      const definition = definitions[object.kind];
      const bounds = boundsOf(object.footprints.flat());
      const owner = entities.get(owners.get(object.id) ?? '');
      const health = owner?.findComponent(Health);
      if (owner !== undefined && health !== undefined) {
        this.bodies.set(owner.id, [...(this.bodies.get(owner.id) ?? []), this.records.length]);
        this.standing.add(owner.id);
        const pool = object.partOf === undefined ? health : null;
        this.records.push({ object, entityId: owner.id, health: pool, bounds });
        continue;
      }
      if (definition.health === null) {
        this.records.push({ object, entityId: null, health: null, bounds });
        continue;
      }
      this.records.push(this.spawn(object, definition, bounds));
    }
  }

  /**
   * Notes where the hit that killed `entityId` landed, from where `attackerId` stands: on the fort
   * wall of the structure's body nearest it, when no other part of the body is nearer (attack
   * reach is measured to that nearest point, `EntityStore.aimPointOf`), else on the structure
   * itself. With no attacker or no position for it, on the structure itself. Does nothing for an
   * entity that is no structure's body. Call it when the structure dies (`entity-died`).
   */
  public died(entityId: string, attackerId: string | null): void {
    const body = this.bodies.get(entityId);
    if (body === undefined) return;
    const from = this.entities.get(attackerId ?? '')?.findComponent(Transform)?.position;
    this.hits.set(entityId, from === undefined ? -1 : this.wallHitFrom(body, from));
  }

  /**
   * The map objects that fall when `entityId` is retired, in record order: an obstacle's own
   * object; for a structure, its own objects and the fort wall that took the killing hit (`died`),
   * which falls with it (DEC-217 (12)). The same before and after `removed`.
   */
  public fallen(entityId: string): readonly MapObject[] {
    const object = this.entityObjects.get(entityId);
    if (object !== undefined) return [object];
    const hit = this.hits.get(entityId) ?? -1;
    return (this.bodies.get(entityId) ?? []).flatMap((index) => {
      const record = this.records[index];
      return record !== undefined && (record.object.partOf === undefined || index === hit)
        ? [record.object]
        : [];
    });
  }

  /**
   * Marks only actual retired entities destroyed; a roof toggle never changes this state. A
   * retired structure's body becomes ruins (DEC-217 (12)): its own objects and the wall that took
   * the killing hit are destroyed (`fallen`), and each other fort wall stands as scenery, with no
   * team and a pool of its own (`ruinWall`'s health, DEC-219 (a)), until it is destroyed itself.
   */
  public removed(entityId: string): void {
    const object = this.entityObjects.get(entityId);
    if (object !== undefined) this.destroyed.add(object.id);
    if (!this.standing.delete(entityId)) return;
    const fallen = new Set(this.fallen(entityId));
    for (const index of this.bodies.get(entityId) ?? []) {
      const record = this.records[index];
      if (record === undefined) continue;
      if (fallen.has(record.object)) {
        this.destroyed.add(record.object.id);
        this.records[index] = { ...record, entityId: null, health: null };
      } else {
        this.records[index] = this.spawn(record.object, this.ruinWall, record.bounds);
      }
    }
  }

  /** Exact map object for a live or retired entity. */
  public objectFor(entityId: string): MapObject | undefined {
    return this.entityObjects.get(entityId);
  }

  /** Physical contents belonging to a destroyed building, in deterministic placement order. */
  public contentsOf(buildingId: string): readonly string[] {
    return this.records.flatMap((record) =>
      record.object.buildingId === buildingId && record.entityId !== null ? [record.entityId] : [],
    );
  }

  /** Persistent destroyed identifiers, including walkable rubble left by retired entities. */
  public get destroyedIds(): ReadonlySet<string> {
    return this.destroyed;
  }

  /** Independent diagnostic check against live solids and authored bridge openings. */
  public blockingAt(point: Vec2, radius: number): string | null {
    for (const { object, entityId, health, bounds } of this.records) {
      if (
        point.x + radius < bounds.x ||
        point.x - radius > bounds.x + bounds.width ||
        point.y + radius < bounds.y ||
        point.y - radius > bounds.y + bounds.height ||
        !object.isBlocking ||
        this.destroyed.has(object.id) ||
        // A structure's body stands until the structure is retired (`removed`), so only an
        // object's own death counts.
        (health?.isDead === true && !this.standing.has(entityId ?? '')) ||
        object.passages?.some((shape) => isCircleInsidePolygon(point, radius, shape)) === true
      )
        continue;
      if (object.footprints.some((shape) => doesCircleOverlapPolygon(point, radius, shape)))
        return object.id;
    }
    return null;
  }

  /** Snapshot state contains no simulation components or mutable references. */
  public snapshot(): readonly MapObjectSnapshot[] {
    return this.records.map(({ object, entityId, health }) => ({
      id: object.id,
      entityId,
      health: health === null ? null : { current: health.current, max: health.max },
      isDestroyed: this.destroyed.has(object.id),
    }));
  }

  /**
   * The record index of the fort wall of `body` nearest `from`, lower index on a tie, or -1 when
   * a part of the body that is no wall (the keep) is nearer.
   */
  private wallHitFrom(body: readonly number[], from: Vec2): number {
    let wall = -1;
    let wallGap = Number.POSITIVE_INFINITY;
    let ownGap = Number.POSITIVE_INFINITY;
    for (const index of body) {
      const object = this.records[index]?.object;
      const gap =
        object === undefined
          ? Number.POSITIVE_INFINITY
          : nearestPointOnPolygons(from, object.footprints, this.aim);
      if (object?.partOf === undefined) ownGap = Math.min(ownGap, gap);
      else if (gap < wallGap) [wall, wallGap] = [index, gap];
    }
    return wallGap <= ownGap ? wall : -1;
  }

  /** Spawns `object` as an obstacle of `definition` at its footprints' centroid. */
  private spawn(
    object: MapObject,
    definition: ObstacleDefinition,
    bounds: Rect,
  ): WorldObjectRecord {
    const points = object.footprints.flat();
    const position = points.reduce(
      (sum, p) => ({ x: sum.x + p.x / points.length, y: sum.y + p.y / points.length }),
      { x: 0, y: 0 },
    );
    const entity = this.factory.create('obstacle', definition.id, { position });
    entity.addComponent(new MapObjectBody(object));
    // Stand-in for the Structure family's Team (07 §1, sprint 2.1): own-side attacks are refused.
    if (object.team !== undefined) entity.addComponent(new TeamMembership(object.team));
    this.entities.add(entity);
    this.entityObjects.set(entity.id, object);
    return { object, entityId: entity.id, health: entity.getComponent(Health), bounds };
  }
}
