import { Collider } from '../components/Collider';
import { Health } from '../components/Health';
import { MapObjectBody } from '../components/MapObjectBody';
import { TeamMembership } from '../components/TeamMembership';
import type {
  MapObject,
  MapObjectCondition,
  MapObjectSnapshot,
} from '../content/maps/mapObjects.types';
import type { Entity } from '../entities/Entity';
import type { EntityStore } from './EntityStore';
import type { WorldObjectRecord, WorldObjectStoreOptions } from './WorldObjectStore.types';
import type { Vec2 } from '../utils/geometry.types';
import { doesCircleOverlapPolygon, isCircleInsidePolygon } from '../utils/circlePolygon';
import { boundsOf, isPointInBlockingArea } from '../utils/geometry';

/** Owns placed-object identity and persistent destroyed state after DeathSystem retires entities. */
export class WorldObjectStore {
  private readonly records: WorldObjectRecord[] = [];
  private readonly entityObjects = new Map<string, MapObject>();
  private readonly destroyed = new Set<string>();
  /** The ids of the structure bodies that outlive their structure: they block and draw as ruins. */
  private readonly ruined = new Set<string>();

  /** A standing structure's id → the index of the record of the map object that is its body. */
  private readonly owned = new Map<string, number>();

  /** A standing structure's id → the index of the record of the map object it is mounted on. */
  private readonly mounts = new Map<string, number>();

  /**
   * Spawns physical objects through the existing registry/factory; terrain has no health entity.
   * An object named in `owners` gets no entity of its own: its health is its structure's (one pool,
   * DEC-185 B: a lane tower's fort map object, DEC-217 (13); a wall turret's pylon), so a hit on it
   * is a hit on the structure. It outlives its structure as a ruin that still blocks (`removed`).
   * An object named in `mounted` (a wall turret's pylon, DEC-388) gets its own entity and health,
   * as any object does, and a structure is mounted on it: see `contentsOf` and `removed`.
   *
   * @param options - The objects, how to spawn them, and the structures some of them are bodies
   *   of or are mounted on.
   */
  public constructor({
    objects,
    factory,
    entities,
    definitions,
    owners = new Map(),
    mounted = new Map(),
  }: WorldObjectStoreOptions) {
    for (const object of objects) {
      const definition = definitions[object.kind];
      const points = object.footprints.flat();
      const bounds = boundsOf(points);
      const owner = entities.get(owners.get(object.id) ?? '');
      const health = owner?.findComponent(Health);
      if (owner !== undefined && health !== undefined) {
        this.owned.set(owner.id, this.records.length);
        this.records.push({ object, entityId: owner.id, health, bounds });
        continue;
      }
      if (definition.health === null) {
        this.records.push({ object, entityId: null, health: null, bounds });
        continue;
      }
      const position = points.reduce(
        (sum, p) => ({ x: sum.x + p.x / points.length, y: sum.y + p.y / points.length }),
        { x: 0, y: 0 },
      );
      const entity = factory.create('obstacle', definition.id, { position });
      entity.addComponent(new MapObjectBody(object));
      // Stand-in for the Structure family's Team (07 §1, sprint 2.1): own-side attacks are refused.
      if (object.team !== undefined) entity.addComponent(new TeamMembership(object.team));
      entities.add(entity);
      this.entityObjects.set(entity.id, object);
      const load = this.mount(entities, mounted.get(object.id), entity);
      this.records.push({
        object,
        entityId: entity.id,
        health: entity.getComponent(Health),
        bounds,
        ...(load !== undefined && { mounted: load }),
      });
    }
  }

  /**
   * Links the object entity `body` to the structure `structureId` mounted on it (DEC-388), and gives
   * it that structure's breakability at spawn; `StructureSystem` keeps the two equal from then on.
   * Call it before the body's record is pushed.
   *
   * @returns The mounted structure's id and health, or `undefined` when there is none.
   */
  private mount(
    entities: EntityStore,
    structureId: string | undefined,
    body: Entity,
  ): WorldObjectRecord['mounted'] {
    const structure = entities.get(structureId ?? '');
    const health = structure?.findComponent(Health);
    if (structure === undefined || health === undefined) return undefined;
    this.mounts.set(structure.id, this.records.length);
    body
      .findComponent(Collider)
      ?.setUnbreakable(structure.findComponent(Collider)?.isUnbreakable === true);
    return { entityId: structure.id, health };
  }

  /**
   * Marks only actual retired entities destroyed; a roof toggle never changes this state. A
   * retired structure's own map object stays standing and blocking: it is a ruin from then on
   * (DEC-341, HC-Q91; fort pieces become ruins that block, DEC-219 (a), DEC-227 Q-C). A lane
   * tower's fort has no health left to take. A wall turret's pylon keeps its own (DEC-388).
   */
  public removed(entityId: string): void {
    const object = this.entityObjects.get(entityId);
    if (object !== undefined) this.destroyed.add(object.id);
    this.leave(this.owned, entityId, (record) => ({ ...record, entityId: null, health: null }));
    this.leave(this.mounts, entityId, ({ object: body, entityId: id, health, bounds }) => ({
      object: body,
      entityId: id,
      health,
      bounds,
    }));
  }

  /**
   * When `structureId` is a key of `bodies`, marks its map object a ruin and replaces that
   * object's record with `keep` of it.
   */
  private leave(
    bodies: Map<string, number>,
    structureId: string,
    keep: (record: WorldObjectRecord) => WorldObjectRecord,
  ): void {
    const index = bodies.get(structureId);
    const record = index === undefined ? undefined : this.records[index];
    if (index === undefined || record === undefined) return;
    bodies.delete(structureId);
    this.ruined.add(record.object.id);
    this.records[index] = keep(record);
  }

  /**
   * The entity id of the map object the standing structure `structureId` is mounted on (a wall
   * turret's pylon, DEC-388), or `undefined` when none does.
   */
  public mountOf(structureId: string): string | undefined {
    const index = this.mounts.get(structureId);
    if (index === undefined) return undefined;
    return this.records[index]?.entityId ?? undefined;
  }

  /** Exact map object for a live or retired entity. */
  public objectFor(entityId: string): MapObject | undefined {
    return this.entityObjects.get(entityId);
  }

  /**
   * What falls with the map object `buildingId`, in deterministic placement order: the physical
   * contents of a building, and the structure mounted on the object (a wall turret on its pylon,
   * DEC-388).
   */
  public contentsOf(buildingId: string): readonly string[] {
    return this.records.flatMap(({ object, entityId, mounted }) => [
      ...(object.buildingId === buildingId && entityId !== null ? [entityId] : []),
      ...(object.id === buildingId && mounted !== undefined ? [mounted.entityId] : []),
    ]);
  }

  /** Persistent destroyed identifiers, including walkable rubble left by retired entities. */
  public get destroyedIds(): ReadonlySet<string> {
    return this.destroyed;
  }

  /**
   * Independent diagnostic check against live solids and authored bridge openings: the first
   * surviving blocking object whose footprint a circle of `radius` at `point` overlaps, outside its
   * passages, or `null`.
   *
   * @param launch - A shot's launch point: a footprint whose blocking area (inside it or on its
   *   edge, inside none of the object's passages) holds it does not count, as it does not stop the
   *   shot (DEC-334).
   */
  public blockingAt(point: Vec2, radius: number, launch?: Vec2): string | null {
    for (const { object, entityId, health, bounds } of this.records) {
      if (
        point.x + radius < bounds.x ||
        point.x - radius > bounds.x + bounds.width ||
        point.y + radius < bounds.y ||
        point.y - radius > bounds.y + bounds.height ||
        !object.isBlocking ||
        this.destroyed.has(object.id) ||
        // A structure's body (a fort, a pylon) outlives the structure (`removed`), so only an
        // object's own death counts.
        (health?.isDead === true && !this.owned.has(entityId ?? '')) ||
        object.passages?.some((shape) => isCircleInsidePolygon(point, radius, shape)) === true
      )
        continue;
      if (
        object.footprints.some(
          (shape) =>
            doesCircleOverlapPolygon(point, radius, shape) &&
            (launch === undefined || !isPointInBlockingArea(launch, shape, object.passages)),
        )
      )
        return object.id;
    }
    return null;
  }

  /** Destroyed wins over a ruin: a pylon can be a ruin first and fall later (DEC-388). */
  private conditionOf(id: string): MapObjectCondition {
    if (this.destroyed.has(id)) return 'destroyed';
    return this.ruined.has(id) ? 'ruin' : 'standing';
  }

  /** Snapshot state contains no simulation components or mutable references. */
  public snapshot(): readonly MapObjectSnapshot[] {
    return this.records.map(({ object, entityId, health, mounted }) => ({
      id: object.id,
      entityId,
      health: health === null ? null : { current: health.current, max: health.max },
      condition: this.conditionOf(object.id),
      ...(mounted !== undefined && {
        mountedHealth: { current: mounted.health.current, max: mounted.health.max },
      }),
    }));
  }
}
