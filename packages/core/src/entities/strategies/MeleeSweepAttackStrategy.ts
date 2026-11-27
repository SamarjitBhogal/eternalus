import { Combat } from '../../components/Combat';
import { Transform } from '../../components/Transform';
import type { UnitAttack } from '../../content/units/units.types';
import type { HitArea } from '../../state/AreaHitQuery.types';
import { cos } from '../../utils/deterministicMath';
import { RADIANS_PER_DEGREE, isPointInPolygon } from '../../utils/geometry';
import type { Vec2 } from '../../utils/geometry.types';
import { doesSectorReachDisc, doesSectorReachPolygon } from '../../utils/sector';
import type { Entity } from '../Entity';
import type { AttackAim, AttackContext, AttackStrategy } from './AttackStrategy.types';
import { weaponSourceOf } from './weaponSourceOf';

/**
 * Swings a weapon (DEC-184): damages every enemy body the sector in front of the attacker reaches,
 * in the same tick, through the damage pipeline, then runs each hit's effects. The sector has its
 * tip at the attacker's centre, points along `aim.direction`, reaches the attacker's radius plus
 * the attack's `reach` (the reach counts from the body edge) and spans `arcDegrees` (DEC-304). The
 * bodies come from the one hit rule for areas (`AreaHitQuery`, DEC-322 (3)): a body with an
 * outline is hit when the attacker stands inside it or the sector reaches the outline; any other
 * body when the sector overlaps its collider circle. A walk-on outline is hit only when the swing
 * aims at it, and a body that takes no damage now is not hit (no damage, no on-hit step). The
 * locked target (`aim.targetId`), already checked in reach by `CombatSystem`, is hit without the
 * sector test. There is no wall test, as for one-target melee. Hits land in id order. The swing is
 * recorded on the attacker's `Combat` for the swing visual, and the bodies it hit as the attack's
 * hits (`EntityStore.recordHits`, DEC-322 (2)).
 */
export class MeleeSweepAttackStrategy implements AttackStrategy {
  /**
   * Hits everything in the sector. The source is the attacker and its weapon (`weaponSourceOf`),
   * for every body.
   *
   * @throws Error when handed an attack that is not a sweep (a miswired registry), or when the
   *   attacker has no `Transform` or no `Combat`.
   */
  public attack(
    attacker: Entity,
    aim: AttackAim,
    attack: UnitAttack,
    { state, damage, hits, areas }: AttackContext,
  ): void {
    if (attack.strategy !== 'melee-sweep') {
      throw new Error(`The sweep attack strategy cannot swing a "${attack.strategy}" attack.`);
    }
    const transform = attacker.getComponent(Transform);
    const radius = transform.radius + attack.reach;
    const cosHalfArc = cos((attack.arcDegrees / 2) * RADIANS_PER_DEGREE);
    const hitIds = areas.find(
      state.entities,
      attacker.id,
      MeleeSweepAttackStrategy.sector(aim, transform.position, radius, cosHalfArc),
      aim,
      { team: 'enemies' },
    );
    for (const id of hitIds) {
      damage.apply(state, id, attack.damage, weaponSourceOf(attacker));
      hits?.afterHit(state, attacker.id, id, attack);
    }
    state.entities.recordHits(attacker.id, hitIds, state.tick);
    attacker.getComponent(Combat).recordSwing({
      atTick: state.tick,
      direction: aim.direction,
      radius,
      arcDegrees: attack.arcDegrees,
    });
  }

  /**
   * The swing's sector as a `HitArea`. It holds the locked target by id, and a body whose outline
   * the attacker stands inside (`doesSectorReachPolygon` leaves the tip to the caller).
   */
  private static sector(aim: AttackAim, origin: Vec2, radius: number, cosHalfArc: number): HitArea {
    return {
      overlapsBody: ({ id, position, radius: bodyRadius }) =>
        id === aim.targetId ||
        doesSectorReachDisc(origin, aim.direction, radius, cosHalfArc, position, bodyRadius),
      overlapsOutline: (polygon, { id }) =>
        id === aim.targetId ||
        isPointInPolygon(origin, polygon) ||
        doesSectorReachPolygon(origin, aim.direction, radius, cosHalfArc, polygon),
    };
  }
}
