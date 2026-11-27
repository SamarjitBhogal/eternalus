import { Health } from '../components/Health';
import { MapObjectBody } from '../components/MapObjectBody';
import { TeamMembership } from '../components/TeamMembership';
import type { MapObject, MapObjectSnapshot } from '../content/maps/mapObjects.types';
import type { WorldObjectRecord, WorldObjectStoreOptions } from './WorldObjectStore.types';
import type { Rect, Vec2 } from '../utils/geometry.types';
import { doesCircleOverlapPolygon, isCircleInsidePolygon } from '../utils/circlePolygon';
import { boundsOf, isPointInBlockingArea } from '../utils/geometry';
import { BLOCKING_CELL_SIZE } from './WorldObjectStore.constants';

/** Owns placed-object identity and persistent destroyed state after DeathSystem retires entities. */
export class WorldObjectStore {
  private readonly records: WorldObjectRecord[] = [];
  private readonly entityObjects = new Map<string, MapObject>();
  private readonly destroyed = new Set<string>();
  /** The ids of the structure bodies that outlive their structure: they block and draw as ruins. */
  private readonly ruined = new Set<string>();

  /** A standing structure's id → the index of the record of the map object that is its body. */
  private readonly owned = new Map<string, number>();

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
   * DEC-185 B: a lane tower's fort map object, DEC-217 (13); a wall turret's pylon), so a hit on it
   * is a hit on the structure. It outlives its structure as a ruin that still blocks (`removed`).
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
      this.records.push({
        object,
        entityId: entity.id,
        health: entity.getComponent(Health),
        bounds,
      });
    }
  }

  /**
   * Marks only actual retired entities destroyed; a roof toggle never changes this state. A
   * retired structure's own map object (a lane tower's fort, a wall turret's pylon) stays standing
   * and blocking, with no health left to take: it is a ruin from then on (DEC-341, HC-Q91; fort
   * pieces become ruins that block, DEC-219 (a), DEC-227 Q-C).
   */
  public removed(entityId: string): void {
    const object = this.entityObjects.get(entityId);
    if (object !== undefined) this.destroyed.add(object.id);
    const index = this.owned.get(entityId);
    const record = index === undefined ? undefined : this.records[index];
    if (index !== undefined && record !== undefined) {
      this.owned.delete(entityId);
      this.ruined.add(record.object.id);
      this.records[index] = { ...record, entityId: null, health: null };
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
      // A structure's body (a fort, a pylon) outlives the structure (`removed`), so only an
      // object's own death counts.
      (health?.isDead === true && !this.owned.has(entityId ?? '')) ||
      object.passages?.some((shape) => isCircleInsidePolygon(point, radius, shape)) === true
    )
      return false;
    return object.footprints.some(
      (shape) =>
        doesCircleOverlapPolygon(point, radius, shape) &&
        (launch === undefined || !isPointInBlockingArea(launch, shape, object.passages)),
    );
  }

  /** Snapshot state contains no simulation components or mutable references. */
  public snapshot(): readonly MapObjectSnapshot[] {
    return this.records.map(({ object, entityId, health }) => ({
      id: object.id,
      entityId,
      health: health === null ? null : { current: health.current, max: health.max },
      isDestroyed: this.destroyed.has(object.id),
      ...(this.ruined.has(object.id) && { isRuined: true as const }),
    }));
  }
}
