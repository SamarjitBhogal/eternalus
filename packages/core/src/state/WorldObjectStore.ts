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
import type { Rect, Vec2 } from '../utils/geometry.types';
import { doesCircleOverlapPolygon, isCircleInsidePolygon } from '../utils/circlePolygon';
import { boundsOf, doesShapeStopShot } from '../utils/geometry';
import { BLOCKING_CELL_SIZE } from './WorldObjectStore.constants';

/** Owns placed-object identity and persistent destroyed state after DeathSystem retires entities. */
export class WorldObjectStore {
  private readonly records: WorldObjectRecord[] = [];
  private readonly entityObjects = new Map<string, MapObject>();
  private readonly destroyed = new Set<string>();
  /** The ids of the structure bodies that outlive their structure: they block and draw as ruins. */
  private readonly ruined = new Set<string>();

  /**
   * A standing structure's id → the indices of the records of the map objects that are its body
   * (a fort; the Stronghold's outer walls and throne, DEC-386 (1)).
   */
  private readonly owned = new Map<string, number[]>();

  /** A standing structure's id → the index of the record of the map object it is mounted on. */
  private readonly mounts = new Map<string, number>();

  /**
   * The search grid of `blockingAt`: a cell's key → the indexes of the records whose box touches
   * the cell, in placement order. A search reads only the cells that its circle touches.
   */
  private readonly cells = new Map<string, number[]>();

  /** How many records `cells` indexes. `blockingAt` rebuilds the grid when the count changes. */
  private indexedCount = 0;

  /**
   * Spawns physical objects through the existing registry/factory; terrain has no health entity.
   * An object named in `owners` gets no entity of its own: its health is its structure's (one pool,
   * DEC-185 B: a lane tower's fort map object, DEC-217 (13); the Stronghold's outer walls and
   * throne, DEC-386 (1)), so a hit on it is a hit on the structure. It outlives its structure as a
   * ruin that still blocks (`removed`).
   * An object named in `mounted` (a wall turret's pylon, DEC-388) gets its own entity and health,
   * as any object does, and a structure is mounted on it: see `contentsOf` and `removed`.
   * An `isUnbreakable` object's collider is unbreakable, so it takes no damage.
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
        const indices = this.owned.get(owner.id) ?? [];
        indices.push(this.records.length);
        this.owned.set(owner.id, indices);
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
      // A Duel's Cathedral wall (DEC-348): `BreakabilityStep` blocks every hit on it.
      if (object.isUnbreakable === true) entity.getComponent(Collider).setUnbreakable(true);
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
   * Marks only actual retired entities destroyed; a roof toggle never changes this state. Each map
   * object of a retired structure's body (a lane tower's fort, the Stronghold's outer walls and
   * throne) stays standing and blocking, with no health left to take: it is a ruin from then on
   * (DEC-341, HC-Q91; fort pieces become ruins that block, DEC-219 (a), DEC-227 Q-C). For a lane
   * tower's fort (DEC-219 (a)) and the Stronghold's outer walls and throne (DEC-408) this is an
   * interim: PR #98's `StructureRuins` brings the fort rule. The pylon a retired wall turret was
   * mounted on is a ruin too, but keeps its own health (DEC-388).
   */
  public removed(entityId: string): void {
    const object = this.entityObjects.get(entityId);
    if (object !== undefined) this.destroyed.add(object.id);
    this.leave(this.owned.get(entityId) ?? [], (record) => ({
      ...record,
      entityId: null,
      health: null,
    }));
    this.owned.delete(entityId);
    const mount = this.mounts.get(entityId);
    this.leave(
      mount === undefined ? [] : [mount],
      ({ object: body, entityId: id, health, bounds }) => ({
        object: body,
        entityId: id,
        health,
        bounds,
      }),
    );
    this.mounts.delete(entityId);
  }

  /**
   * Marks the map objects of the records at `indices` ruins and replaces each record with `keep`
   * of it.
   */
  private leave(
    indices: readonly number[],
    keep: (record: WorldObjectRecord) => WorldObjectRecord,
  ): void {
    for (const index of indices) {
      const record = this.records[index];
      if (record === undefined) continue;
      this.ruined.add(record.object.id);
      this.records[index] = keep(record);
    }
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
   * DEC-388). A structure's body is not content: it has no health of its own, so a collapse does
   * not break it (the Stronghold's outer walls and throne stand in its palace, DEC-386 (1)).
   */
  public contentsOf(buildingId: string): readonly string[] {
    return this.records.flatMap(({ object, entityId, mounted }) => [
      ...(object.buildingId === buildingId && entityId !== null && !this.owned.has(entityId)
        ? [entityId]
        : []),
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
   * @param launch - A shot's launch point: a footprint that does not stop the shot does not count
   *   (`doesShapeStopShot`, the rule the collision sweep uses): one whose blocking area (inside it
   *   or on its edge, inside none of the object's passages) holds the launch point (DEC-334), or
   *   one of an object shots can cross (`canShotsCross`, DEC-345). Without it (a unit) every
   *   footprint counts.
   */
  public blockingAt(point: Vec2, radius: number, launch?: Vec2): string | null {
    const cells = this.grid();
    const box = { x: point.x - radius, y: point.y - radius, width: 2 * radius, height: 2 * radius };
    const keys = WorldObjectStore.cellKeysOf(box, cells.size);
    if (keys === null)
      return (
        this.records.find((_, index) => this.blocks(index, point, radius, launch))?.object.id ??
        null
      );
    let first = Infinity;
    for (const key of keys) {
      // A cell lists its records in placement order, so its first hit is its earliest one.
      for (const index of cells.get(key) ?? []) {
        if (index >= first) break;
        if (this.blocks(index, point, radius, launch)) {
          first = index;
          break;
        }
      }
    }
    return this.records[first]?.object.id ?? null;
  }

  /**
   * The search grid, built on first use and again whenever the record count changes, so any path
   * that adds records is covered. A record replaced in place keeps its object, so its box holds.
   */
  private grid(): ReadonlyMap<string, readonly number[]> {
    if (this.indexedCount === this.records.length) return this.cells;
    this.cells.clear();
    this.records.forEach(({ bounds }, index) => {
      for (const key of WorldObjectStore.cellKeysOf(bounds) ?? []) {
        const cell = this.cells.get(key);
        if (cell === undefined) this.cells.set(key, [index]);
        else cell.push(index);
      }
    });
    this.indexedCount = this.records.length;
    return this.cells;
  }

  /**
   * The keys of the grid cells that `box` touches, or `null` when it touches more than `limit`
   * cells or a number in it is not finite. A broken position (NaN, ±Infinity; the finite-transforms
   * invariant reports it) or a huge circle must not loop over cells without end.
   */
  private static cellKeysOf(box: Rect, limit = Number.MAX_SAFE_INTEGER): string[] | null {
    const firstColumn = Math.floor(box.x / BLOCKING_CELL_SIZE);
    const firstRow = Math.floor(box.y / BLOCKING_CELL_SIZE);
    const lastColumn = Math.floor((box.x + box.width) / BLOCKING_CELL_SIZE);
    const lastRow = Math.floor((box.y + box.height) / BLOCKING_CELL_SIZE);
    if (!((lastColumn - firstColumn + 1) * (lastRow - firstRow + 1) <= limit)) return null;
    const keys: string[] = [];
    for (let column = firstColumn; column <= lastColumn; column += 1)
      for (let row = firstRow; row <= lastRow; row += 1)
        keys.push(`${String(column)}:${String(row)}`);
    return keys;
  }

  /** Whether record `index` blocks a circle of `radius` at `point`, by the rules of `blockingAt`. */
  private blocks(index: number, point: Vec2, radius: number, launch?: Vec2): boolean {
    const record = this.records[index];
    if (record === undefined) return false;
    const { object, entityId, health, bounds } = record;
    if (
      point.x + radius < bounds.x ||
      point.x - radius > bounds.x + bounds.width ||
      point.y + radius < bounds.y ||
      point.y - radius > bounds.y + bounds.height ||
      !object.isBlocking ||
      this.destroyed.has(object.id) ||
      // A structure's body (a fort, the Stronghold's outer walls and throne) outlives the
      // structure (`removed`), so only an object's own death counts.
      (health?.isDead === true && !this.owned.has(entityId ?? '')) ||
      object.passages?.some((shape) => isCircleInsidePolygon(point, radius, shape)) === true
    )
      return false;
    return object.footprints.some(
      (shape) =>
        doesCircleOverlapPolygon(point, radius, shape) &&
        (launch === undefined || doesShapeStopShot(shape, object, launch)),
    );
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
