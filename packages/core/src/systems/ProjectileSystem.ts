import { ProjectileFlight } from '../components/ProjectileFlight';
import { Transform } from '../components/Transform';
import { MapObjectBody } from '../components/MapObjectBody';
import { Health } from '../components/Health';
import { MAGUS_BOLT } from '../content/projectiles/magusBolt';
import type { DamagePipeline } from '../combat/DamagePipeline';
import type { EntityFactory } from '../entities/EntityFactory';
import type { GameState } from '../state/GameState';
import { distance, isPointInPolygon } from '../utils/geometry';
import { sweepCircle } from '../physics/sweepCircle';
import type { System, SystemContext } from './System.types';

/** Advances point bolts with swept collision, applying damage once at the first physical hit. */
export class ProjectileSystem implements System {
  public readonly name = 'projectiles';

  /** Subscribes through typed events; no combat-system calls cross this boundary. */
  public constructor(
    state: GameState,
    factory: EntityFactory,
    private readonly damage: DamagePipeline,
  ) {
    state.events.on('projectile-requested', (shot) => {
      const projectile = factory.create('projectile', MAGUS_BOLT.id, {
        position: shot.origin,
        team: state.entities.teamOf(shot.attackerId) ?? 'neutral',
      });
      projectile.addComponent(
        new ProjectileFlight({
          ...shot,
          speed: MAGUS_BOLT.movementProfile.maxSpeed,
          firedTick: state.tick,
        }),
      );
      state.entities.add(projectile);
      state.events.emit('projectile-fired', { entityId: projectile.id, ...shot });
    });
  }

  /** Sweeps every live shot; a removed target never receives delayed damage. */
  public update({ state }: SystemContext): void {
    if (state.match.isIdleHeld) return;
    const retired: string[] = [];
    state.entities.forEach((projectile) => {
      const flight = projectile.findComponent(ProjectileFlight);
      const transform = projectile.findComponent(Transform);
      if (flight === undefined || transform === undefined || flight.shot.firedTick === state.tick)
        return;
      const { shot } = flight;
      const from = { ...transform.position };
      const length = distance(from, shot.destination);
      const travel = Math.min(length, shot.speed / state.config.tickRate);
      const delta =
        length === 0
          ? { x: 0, y: 0 }
          : {
              x: ((shot.destination.x - from.x) * travel) / length,
              y: ((shot.destination.y - from.y) * travel) / length,
            };
      let first = 1;
      const hit: { targetId: string | null } = { targetId: null };
      state.entities.forEach((candidate) => {
        if (
          candidate.id === projectile.id ||
          candidate.id === shot.attackerId ||
          candidate.findComponent(Health)?.isDead !== false
        )
          return;
        const body = candidate.findComponent(MapObjectBody)?.object;
        if (candidate.id !== shot.targetId && body?.isBlocking !== true) return;
        const target = candidate.findComponent(Transform);
        if (target === undefined) return;
        const polygons = body?.footprints ?? [];
        const contacts =
          polygons.length > 0
            ? polygons.map((polygon) =>
                isPointInPolygon(from, polygon)
                  ? 0
                  : sweepCircle(from, delta, MAGUS_BOLT.footprintRadius, polygon)?.time,
              )
            : [ProjectileSystem.circleHit(from, delta, target.position, target.radius)];
        for (const time of contacts)
          if (time !== undefined && time <= first) {
            first = time;
            hit.targetId = candidate.id;
          }
      });
      transform.moveBy({ x: delta.x * first, y: delta.y * first });
      if (hit.targetId !== null) {
        if (state.entities.teamOf(hit.targetId) !== state.entities.teamOf(projectile.id))
          this.damage.apply(state, hit.targetId, shot.damage, {
            attackerId: shot.attackerId,
            kind: 'weapon',
            definitionId: shot.weaponId,
          });
        retired.push(projectile.id);
      } else if (travel >= length) retired.push(projectile.id);
    });
    for (const entityId of retired) {
      state.entities.remove(entityId, 'consumed');
      state.events.emit('entity-removed', { entityId, cause: 'consumed' });
    }
  }

  private static circleHit(
    from: { x: number; y: number },
    delta: { x: number; y: number },
    at: { x: number; y: number },
    radius: number,
  ): number | undefined {
    const x = from.x - at.x,
      y = from.y - at.y,
      a = delta.x * delta.x + delta.y * delta.y,
      b = x * delta.x + y * delta.y,
      c = x * x + y * y - radius * radius;
    if (c <= 0) return 0;
    const discriminant = b * b - a * c;
    if (a === 0 || discriminant < 0) return undefined;
    const time = (-b - Math.sqrt(discriminant)) / a;
    return time >= 0 && time <= 1 ? time : undefined;
  }
}
