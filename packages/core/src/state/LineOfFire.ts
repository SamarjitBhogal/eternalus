import { Combat } from '../components/Combat';
import { Health } from '../components/Health';
import { TeamMembership } from '../components/TeamMembership';
import { Transform } from '../components/Transform';
import type { ContentCatalogue } from '../content/ContentCatalogue';
import type { ProjectileDefinition } from '../content/projectiles/projectiles.types';
import { doesCapsuleReachPolygon } from '../utils/circlePolygon';
import { distance, distanceToSegment, isPointInAnyPolygon } from '../utils/geometry';
import type { Vec2 } from '../utils/geometry.types';
import { normalizeInto, subInto } from '../utils/vec2';
import type { MutableVec2 } from '../utils/vec2.types';
import { AreaHitQuery } from './AreaHitQuery';
import { BODY_BEFORE_WALL_MARGIN } from './CollisionQuery.constants';
import type { EntityId } from './EntityStore.types';
import type { GameState } from './GameState';
import { isTouchedBeforeWall } from './isTouchedBeforeWall';
import type { LineOfFireQuery } from './LineOfFire.types';
import { ReachQuery } from './ReachQuery';

/**
 * The match's line-of-fire query (architecture 05 §10, DEC-317), built once by `Simulation` with
 * the projectile definitions. A shot flies from the attacker's centre to the point it is aimed at
 * (`ReachQuery.aimPointOf`): an outline's nearest point, which the shot touches there, or a unit's
 * centre, whose circle it touches its radius sooner. The line is clear when that contact is within
 * the shot's `range` and touched before the first wall (`isTouchedBeforeWall` on
 * `CollisionQuery.reach`): the rule `ProjectileSystem` lands a shot by, so a fort that is also a
 * wall reads clear. A body that takes no damage now (a forest camp) blocks the line too, when the
 * shot would stop on it (`AreaHitQuery.stopsShot`, the rule `ProjectileSystem` flies a shot by)
 * more than `BODY_BEFORE_WALL_MARGIN` before it touches the target, as `ProjectileSystem` breaks a
 * near tie for the target. A body that takes damage does not: the shot lands on it. An attack
 * needs a line only when it fires a projectile. An attacker inside the target's outline hits it at
 * once.
 *
 * ponytail: the no-damage bodies are found by a walk over the store, O(entities) per call; only
 * bots call it, at their decision cadence. Ceiling: many ranged bots; upgrade to a `SpatialHash`
 * query along the line then.
 */
export class LineOfFire implements LineOfFireQuery {
  /** Scratch for the aim point, then the aim direction. */
  private readonly aim: MutableVec2 = { x: 0, y: 0 };
  private readonly reach = new ReachQuery();

  /**
   * @param projectiles - The projectile definitions: a shot sweeps its `footprintRadius` and flies
   *   its `range`.
   */
  public constructor(
    private readonly projectiles: Pick<ContentCatalogue<ProjectileDefinition>, 'get'>,
  ) {}

  /** {@inheritDoc LineOfFireQuery.isClear} */
  public isClear(state: GameState, attackerId: EntityId, targetId: EntityId): boolean {
    const attacker = state.entities.get(attackerId);
    const attack = attacker?.findComponent(Combat)?.attack;
    const from = attacker?.findComponent(Transform)?.position;
    const target = state.entities.get(targetId);
    if (
      state.collisions === null ||
      attack === undefined ||
      !('projectile' in attack) ||
      from === undefined ||
      target === undefined
    ) {
      return true;
    }
    const aimed = this.reach.aimPointOf(state.entities, targetId, from, this.aim);
    if (aimed === null || aimed === 'inside') {
      return true;
    }
    const shot = this.projectiles.get(attack.projectile.projectileId);
    const targetRadius = aimed === 'centre' ? target.getComponent(Transform).radius : 0;
    const contact = distance(from, this.aim) - shot.footprintRadius - targetRadius;
    if (contact <= 0) {
      return true;
    }
    if (contact > shot.range) {
      return false;
    }
    normalizeInto(this.aim, subInto(this.aim, this.aim, from));
    const wall = state.collisions.reach(from, this.aim, contact, shot.footprintRadius);
    return (
      isTouchedBeforeWall(contact, wall) &&
      !this.isBlocked(state, attackerId, targetId, from, contact, shot.footprintRadius)
    );
  }

  /**
   * Whether a body that takes no damage now stops `attackerId`'s shot (`AreaHitQuery.stopsShot`)
   * more than `BODY_BEFORE_WALL_MARGIN` before the shot touches the target `contact` metres along
   * `this.aim`: the capsule a shot of `radius` sweeps up to there reaches the body's outline, or its
   * collider circle. The target never reaches that capsule: it ends before the target's nearest
   * point. `false` for an attacker with no team, which fires no shot.
   */
  private isBlocked(
    state: GameState,
    attackerId: EntityId,
    targetId: EntityId,
    from: Vec2,
    contact: number,
    radius: number,
  ): boolean {
    const team = state.entities.teamOf(attackerId);
    const length = contact - BODY_BEFORE_WALL_MARGIN;
    if (team === undefined || length <= 0) return false;
    const shot = { ownerId: attackerId, team, targetId };
    const to = { x: from.x + this.aim.x * length, y: from.y + this.aim.y * length };
    let isBlocked = false;
    state.entities.forEach((entity) => {
      if (isBlocked || !state.entities.takesNoDamage(entity.id)) return;
      const health = entity.findComponent(Health);
      const transform = entity.findComponent(Transform);
      if (health === undefined || transform === undefined) return;
      const outline = state.entities.outlineOf(entity.id) ?? null;
      const body = { entity, health, membership: entity.findComponent(TeamMembership), outline };
      if (!AreaHitQuery.stopsShot(state.entities, shot, body)) return;
      isBlocked =
        outline === null
          ? distanceToSegment(transform.position, from, to) <= radius + transform.radius
          : isPointInAnyPolygon(from, outline.polygons) ||
            outline.polygons.some((polygon) => doesCapsuleReachPolygon(from, to, radius, polygon));
    });
    return isBlocked;
  }
}
