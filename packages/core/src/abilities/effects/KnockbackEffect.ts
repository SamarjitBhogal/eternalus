import type { KnockbackSpec, WithoutTimes } from '../../content/abilities/AbilityDefinition.types';
import type { KnockbackDefinition } from '../../content/abilities/knockback';
import { Movement } from '../../components/Movement';
import { Transform } from '../../components/Transform';
import type { EntityId } from '../../state/EntityStore.types';
import type { Vec2 } from '../../utils/geometry.types';
import { normalize } from '../../utils/vec2';
import type { AbilityDisplayStep } from '../../content/loadDisplayContent';
import type { AbilityEffect, CastContext } from '../AbilityEffect.types';
import { healthConditionProblems, mustBePositive } from '../specChecks';

/**
 * Knocks every enemy in the step's shape away from the shape's centre (architecture 05 §3) as
 * forced motion on its `Movement` (plan arch call 6), over the knock-back travel time. DEC-208: the
 * content `distance` is for a target of base mass and a heavier target moves less,
 * `distance × baseMass / max(baseMass, mass)` (`content/abilities/knockback.ts`, a proposal pending
 * the owner); knock-backs that reach one target in the same tick add up as vectors, because each
 * is its own push. A target exactly on the centre is pushed along the cast's direction, and not at
 * all when the cast has none (aimed at the caster). Every target the step reaches, moved or not,
 * is staggered; `knockup` also knocks it up. A target whose push a wall stops short (a map object,
 * a wall, a placed wall or a structure: `CollisionQuery.hitsWall` on the straight push; the map's
 * edge does not count) takes the tuning's `impactDamage`, once per push, credited to the caster
 * under the cast's id, through the match's one `DamagePipeline`, so friendly fire and the status
 * multipliers apply (DEC-382, `INBOX.md` HC-B43 (6)). It lands in the tick of the push.
 *
 * @remarks ponytail: the wall test is the straight sweep of the whole push at the cast, not the
 * travel (`MovementSystem` moves it over `travelTicks` with the target's own walking, sliding
 * along a wall). So the hit lands up to the travel time early, and a walk or another push during
 * the travel does not change it. Upgrade path: test each forced step in `CollisionSystem` once a
 * push carries its source.
 */
export class KnockbackEffect implements AbilityEffect<KnockbackSpec> {
  public readonly kind = 'knockback';

  /**
   * @param tuning - Base mass, travel ticks, the follow-up statuses and the impact damage
   *   (`loadKnockback`).
   */
  public constructor(private readonly tuning: KnockbackDefinition) {}

  /** A knock-back needs a positive distance, and health bounds, when set, from 0 to 1. */
  public validate(spec: KnockbackSpec): readonly string[] {
    return [
      ...mustBePositive(spec.distance, 'knockback distance'),
      ...healthConditionProblems(spec.health),
    ];
  }

  /** Its area. */
  public describe({ kind, shape }: WithoutTimes<KnockbackSpec>): readonly AbilityDisplayStep[] {
    return [{ kind, shape }];
  }

  /**
   * Pushes and staggers every enemy in the step's shape whose health meets its condition, in id
   * order, and hits each one whose push a wall stops short.
   */
  public apply(spec: KnockbackSpec, cast: CastContext): void {
    const { state } = cast;
    const { baseMass, travelTicks, staggerStatusId, knockupStatusId } = this.tuning;
    for (const targetId of cast.targets(spec.shape, { team: 'enemies', health: spec.health })) {
      const target = state.entities.get(targetId);
      const movement = target?.findComponent(Movement);
      const transform = target?.findComponent(Transform);
      if (movement !== undefined && transform !== undefined) {
        const { position, radius } = transform;
        const away = KnockbackEffect.awayFrom(cast.centreFor(spec.shape, position), position, cast);
        const metres = (spec.distance * baseMass) / Math.max(baseMass, movement.mass);
        if (away.x !== 0 || away.y !== 0) {
          const isIntoWall = state.collisions?.hitsWall(position, away, metres, radius) === true;
          movement.push({ x: away.x * metres, y: away.y * metres }, travelTicks);
          if (isIntoWall) this.hitOnImpact(targetId, cast);
        }
      }
      cast.statuses.apply(state, targetId, staggerStatusId, cast.casterId);
      if (spec.knockup === true) {
        cast.statuses.apply(state, targetId, knockupStatusId, cast.casterId);
      }
    }
  }

  /** Deals the impact damage to `targetId`, credited to the caster under the cast's id. */
  private hitOnImpact(targetId: EntityId, cast: CastContext): void {
    cast.damage.apply(cast.state, targetId, this.tuning.impactDamage, {
      attackerId: cast.casterId,
      kind: 'ability',
      definitionId: cast.abilityId,
    });
  }

  /** The unit vector from `centre` to `position`; the cast's direction when they coincide. */
  private static awayFrom(centre: Vec2, position: Vec2, cast: CastContext): Vec2 {
    const offset = { x: position.x - centre.x, y: position.y - centre.y };
    return offset.x === 0 && offset.y === 0 ? cast.direction : normalize(offset);
  }
}
