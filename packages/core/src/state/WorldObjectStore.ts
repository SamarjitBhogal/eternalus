import { Health } from '../components/Health';
import { MapObjectBody } from '../components/MapObjectBody';
import { TeamMembership } from '../components/TeamMembership';
import type { MapObject, MapObjectSnapshot } from '../content/maps/mapObjects.types';
import type { ObstacleDefinition } from '../content/obstacles/obstacles.types';
import type { EntityFactory } from '../entities/EntityFactory';
import type { EntityStore } from './EntityStore';
import type { WorldObjectRecord, WorldObjectStoreOptions } from './WorldObjectStore.types';
import type { Rect, Vec2 } from '../utils/geometry.types';
import { doesCircleOverlapPolygon, isCircleInsidePolygon } from '../utils/circlePolygon';
import { boundsOf } from '../utils/geometry';

/** Owns placed-object identity and persistent destroyed state after DeathSystem retires entities. */
export class WorldObjectStore {
  private readonly records: WorldObjectRecord[] = [];
  private readonly entityObjects = new Map<string, MapObject>();
  private readonly destroyed = new Set<string>();
  private readonly factory: EntityFactory;
  private readonly entities: EntityStore;

  /** A structure's id → the indexes of the records of the map objects that are its body. */
  private readonly bodies = new Map<string, readonly number[]>();

  /** Map object id → the index of its record. */
  private readonly indexes = new Map<string, number>();

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
  }: WorldObjectStoreOptions) {
    this.factory = factory;
    this.entities = entities;
    for (const object of objects) {
      this.indexes.set(object.id, this.records.length);
      const definition = definitions[object.kind];
      const bounds = boundsOf(object.footprints.flat());
      const owner = entities.get(owners.get(object.id) ?? '');
      const health = owner?.findComponent(Health);
      if (owner !== undefined && health !== undefined) {
        this.bodies.set(owner.id, [...(this.bodies.get(owner.id) ?? []), this.records.length]);
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
   * Marks only actual retired entities destroyed; a roof toggle never changes this state. A
   * structure's body is the caller's to retire (`destroy`, `standAlone`, 07 §8): a retired
   * structure id changes nothing here.
   */
  public removed(entityId: string): void {
    const object = this.entityObjects.get(entityId);
    if (object !== undefined) this.destroyed.add(object.id);
  }

  /** The map objects of the body of the structure `structureId`, in record order; none for any other id. */
  public bodyOf(structureId: string): readonly MapObject[] {
    return (this.bodies.get(structureId) ?? []).flatMap((index) => {
      const record = this.records[index];
      return record === undefined ? [] : [record.object];
    });
  }

  /** Destroys `object` for good: it has no entity and no health pool afterwards (its record stays). */
  public destroy(object: MapObject): void {
    const index = this.indexes.get(object.id);
    const record = index === undefined ? undefined : this.records[index];
    if (index === undefined || record === undefined) return;
    this.destroyed.add(object.id);
    this.records[index] = { ...record, entityId: null, health: null };
  }

  /**
   * Makes `object` stand on its own: a spawned obstacle entity of `definition`, with a health pool
   * of its own and no team of its own beyond the object's, in place of the structure it was part of.
   */
  public standAlone(object: MapObject, definition: ObstacleDefinition): void {
    const index = this.indexes.get(object.id);
    const record = index === undefined ? undefined : this.records[index];
    if (index === undefined || record === undefined) return;
    this.records[index] = this.spawn(object, definition, record.bounds);
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
        // A structure's body stands until its objects are retired (`destroy`, `standAlone`), which
        // rewrites every body record, so only an object's own death counts.
        (health?.isDead === true && !this.bodies.has(entityId ?? '')) ||
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
