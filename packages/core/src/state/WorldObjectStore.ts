import { Health } from '../components/Health';
import { MapObjectBody } from '../components/MapObjectBody';
import { TeamMembership } from '../components/TeamMembership';
import type { MapObject, MapObjectSnapshot } from '../content/maps/mapObjects.types';
import type { WorldObjectRecord, WorldObjectStoreOptions } from './WorldObjectStore.types';
import type { Vec2 } from '../utils/geometry.types';
import { doesCircleOverlapPolygon, isCircleInsidePolygon } from '../utils/circlePolygon';
import { boundsOf, doesShapeStopShot } from '../utils/geometry';

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

  /**
   * Spawns physical objects through the existing registry/factory; terrain has no health entity.
   * An object named in `owners` gets no entity of its own: its health is its structure's (one pool,
   * DEC-185 B: a lane tower's fort map object, DEC-217 (13); a wall turret's pylon; the
   * Stronghold's outer walls and throne, DEC-386 (1)), so a hit on it is a hit on the structure. It
   * outlives its structure as a ruin that still blocks (`removed`).
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
   * Marks only actual retired entities destroyed; a roof toggle never changes this state. Each map
   * object of a retired structure's body (a lane tower's fort, a wall turret's pylon, the
   * Stronghold's outer walls and throne) stays standing and blocking, with no health left to take:
   * it is a ruin from then on (DEC-341, HC-Q91; fort pieces become ruins that block, DEC-219 (a),
   * DEC-227 Q-C).
   */
  public removed(entityId: string): void {
    const object = this.entityObjects.get(entityId);
    if (object !== undefined) this.destroyed.add(object.id);
    for (const index of this.owned.get(entityId) ?? []) {
      const record = this.records[index];
      if (record === undefined) continue;
      this.ruined.add(record.object.id);
      this.records[index] = { ...record, entityId: null, health: null };
    }
    this.owned.delete(entityId);
  }

  /** Exact map object for a live or retired entity. */
  public objectFor(entityId: string): MapObject | undefined {
    return this.entityObjects.get(entityId);
  }

  /**
   * Physical contents belonging to a destroyed building, in deterministic placement order. A
   * structure's body is not content: it has no health of its own, so a collapse does not break it
   * (the Stronghold's outer walls and throne stand in its palace, DEC-386 (1)).
   */
  public contentsOf(buildingId: string): readonly string[] {
    return this.records.flatMap(({ object, entityId }) =>
      object.buildingId === buildingId && entityId !== null && !this.owned.has(entityId)
        ? [entityId]
        : [],
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
   * @param launch - A shot's launch point: a footprint that does not stop the shot does not count
   *   (`doesShapeStopShot`, the rule the collision sweep uses): one whose blocking area (inside it
   *   or on its edge, inside none of the object's passages) holds the launch point (DEC-334), or
   *   one of an object shots can cross (`canShotsCross`, DEC-345). Without it (a unit) every
   *   footprint counts.
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
            (launch === undefined || doesShapeStopShot(shape, object, launch)),
        )
      )
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
      ...(this.ruined.has(object.id) && { isRuined: true as const }),
    }));
  }
}
