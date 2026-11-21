import { Combat } from '../../components/Combat';
import { Health } from '../../components/Health';
import { TeamMembership } from '../../components/TeamMembership';
import { Transform } from '../../components/Transform';
import type { UnitAttack } from '../../content/units/units.types';
import type { EntityId } from '../../state/EntityStore.types';
import type { GameState } from '../../state/GameState';
import { compareById } from '../../utils/compareById';
import { cos } from '../../utils/deterministicMath';
import { RADIANS_PER_DEGREE, isPointInAnyPolygon } from '../../utils/geometry';
import type { Vec2 } from '../../utils/geometry.types';
import { doesSectorReachDisc, doesSectorReachPolygon } from '../../utils/sector';
import type { Entity } from '../Entity';
import type { AttackAim, AttackContext, AttackStrategy } from './AttackStrategy.types';
import { weaponSourceOf } from './weaponSourceOf';

/**
 * Swings a weapon (DEC-184): damages every enemy body the sector in front of the attacker reaches,
 * in the same tick, through the damage pipeline, then runs each hit's effects. The sector has its
 * tip at the attacker's centre, points along `aim.direction`, reaches the attacker's radius plus
 * the attack's `reach` (the reach counts from the body edge) and spans `arcDegrees` (DEC-304). A
 * body with an outline (`EntityStore.outlineOf`: a map object, a structure footprint) is hit when
 * the attacker stands inside it or the sector reaches the outline; any other body when the sector
 * overlaps its collider circle. A walk-on outline or a body that takes no damage now is hit only
 * when it is the locked target, as for a shot (`EntityStore.isHitOnlyWhenTargeted`, DEC-317). The
 * locked target (`aim.targetId`), already checked in reach by `CombatSystem`, is always hit.
 * There is no wall test, as for one-target melee. Hits land in id order. The swing is recorded on
 * the attacker's `Combat` for the swing visual.
 */
export class MeleeSweepAttackStrategy implements AttackStrategy {
  /**
   * Hits everything in the sector. The source is the attacker and its weapon (`weaponSourceOf`),
   * for every body.
   *
   * @throws Error when handed an attack that is not a sweep (a miswired registry), or when the
   *   attacker has no `Transform`.
   */
  public attack(
    attacker: Entity,
    aim: AttackAim,
    attack: UnitAttack,
    { state, damage, hits }: AttackContext,
  ): void {
    if (attack.strategy !== 'melee-sweep') {
      throw new Error(`The sweep attack strategy cannot swing a "${attack.strategy}" attack.`);
    }
    const transform = attacker.getComponent(Transform);
    const radius = transform.radius + attack.reach;
    const cosHalfArc = cos((attack.arcDegrees / 2) * RADIANS_PER_DEGREE);
    const hitIds = this.bodiesReached(
      state,
      attacker.id,
      aim,
      transform.position,
      radius,
      cosHalfArc,
    );
    for (const id of hitIds) {
      damage.apply(state, id, attack.damage, weaponSourceOf(attacker));
      hits?.afterHit(state, attacker.id, id);
    }
    attacker.findComponent(Combat)?.recordSwing({
      tick: state.tick,
      direction: aim.direction,
      radius,
      arcDegrees: attack.arcDegrees,
    });
  }

  /**
   * The ids of the live enemy bodies the sector reaches, sorted by id. A walk over the store, not
   * the spatial hash.
   *
   * ponytail: only Legends sweep, a few times a second; the walk is O(entities) per swing. Ceiling:
   * many sweepers (mob weapons); upgrade to a `SpatialHash` query then.
   */
  private bodiesReached(
    state: GameState,
    attackerId: EntityId,
    aim: AttackAim,
    origin: Vec2,
    radius: number,
    cosHalfArc: number,
  ): EntityId[] {
    const attackerTeam = state.entities.teamOf(attackerId);
    const reached: EntityId[] = [];
    state.entities.forEach((entity) => {
      const transform = entity.findComponent(Transform);
      const health = entity.findComponent(Health);
      if (entity.id === attackerId || transform === undefined || health?.isDead !== false) {
        return;
      }
      const team = entity.findComponent(TeamMembership)?.team;
      if (
        (team !== undefined && team === attackerTeam) ||
        (entity.id !== aim.targetId && state.entities.isHitOnlyWhenTargeted(entity.id))
      ) {
        return;
      }
      const outline = state.entities.outlineOf(entity.id)?.polygons;
      const isReached =
        entity.id === aim.targetId ||
        (outline === undefined
          ? doesSectorReachDisc(
              origin,
              aim.direction,
              radius,
              cosHalfArc,
              transform.position,
              transform.radius,
            )
          : isPointInAnyPolygon(origin, outline) ||
            outline.some((polygon) =>
              doesSectorReachPolygon(origin, aim.direction, radius, cosHalfArc, polygon),
            ));
      if (isReached) {
        reached.push(entity.id);
      }
    });
    return reached.sort(compareById);
  }
}
