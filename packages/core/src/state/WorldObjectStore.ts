import { Health } from '../components/Health';
import { MapObjectBody } from '../components/MapObjectBody';
import { TeamMembership } from '../components/TeamMembership';
import type { MapObject, MapObjectKind, MapObjectSnapshot } from '../content/maps/mapObjects.types';
import type { ObstacleDefinition } from '../content/obstacles/obstacles.types';
import type { EntityFactory } from '../entities/EntityFactory';
import type { EntityStore } from './EntityStore';
import type { WorldObjectRecord } from './WorldObjectStore.types';
import type { Vec2 } from '../utils/geometry.types';
import { doesCircleOverlapPolygon, isCircleInsidePolygon } from '../utils/circlePolygon';
import { boundsOf } from '../utils/geometry';

/** Owns placed-object identity and persistent destroyed state after DeathSystem retires entities. */
export class WorldObjectStore {
  private readonly records: WorldObjectRecord[] = [];
  private readonly entityObjects = new Map<string, MapObject>();
  private readonly destroyed = new Set<string>();

  /** Spawns physical objects through the existing registry/factory; terrain has no health entity. */
  public constructor(
    objects: readonly MapObject[],
    factory: EntityFactory,
    entities: EntityStore,
    definitions: Readonly<Record<MapObjectKind, ObstacleDefinition>>,
  ) {
    for (const object of objects) {
      const definition = definitions[object.kind];
      const points = object.footprints.flat();
      const bounds = boundsOf(points);
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

  /** Marks only actual retired entities destroyed; a roof toggle never changes this state. */
  public removed(entityId: string): void {
    const object = this.entityObjects.get(entityId);
    if (object !== undefined) this.destroyed.add(object.id);
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

  /** Independent diagnostic check against live solids and authored bridge openings. */
  public blockingAt(point: Vec2, radius: number): string | null {
    for (const { object, health, bounds } of this.records) {
      if (
        point.x + radius < bounds.x ||
        point.x - radius > bounds.x + bounds.width ||
        point.y + radius < bounds.y ||
        point.y - radius > bounds.y + bounds.height ||
        !object.isBlocking ||
        this.destroyed.has(object.id) ||
        health?.isDead === true ||
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
}
