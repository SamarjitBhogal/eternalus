import type { KnockbackSpec, WithoutTimes } from '../../content/abilities/AbilityDefinition.types';
import type { KnockbackDefinition } from '../../content/abilities/knockback';
import { Movement } from '../../components/Movement';
import { Transform } from '../../components/Transform';
import type { Vec2 } from '../../utils/geometry.types';
import { TickRate } from '../../utils/TickRate';
import { normalize } from '../../utils/vec2';
import type { AbilityDisplayStep } from '../../content/loadDisplayContent';
import type { AbilityEffect, CastContext } from '../AbilityEffect.types';
import { mustBePositive } from '../specChecks';

/**
 * Knocks every enemy in the step's shape away from the shape's centre (architecture 05 §3) as
 * forced motion on its `Movement` (plan arch call 6), over the knock-back travel time. DEC-208: the
 * content `distance` is for a target of base mass and a heavier target moves less,
 * `distance × baseMass / max(baseMass, mass)` (`content/abilities/knockback.ts`, a proposal pending
 * the owner); knock-backs that reach one target in the same tick add up as vectors, because each
 * is its own push. A target exactly on the centre is pushed along the cast's direction, and not at
 * all when the cast has none (aimed at the caster). Every target the step reaches, moved or not,
 * is staggered; `knockup` also knocks it up.
 */
export class KnockbackEffect implements AbilityEffect<KnockbackSpec> {
  public readonly kind = 'knockback';

  /** @param tuning - Base mass, travel time and the follow-up statuses (`content/abilities/knockback.ts`). */
  public constructor(private readonly tuning: KnockbackDefinition) {}

  /** A knock-back needs a positive distance. */
  public validate(spec: KnockbackSpec): readonly string[] {
    return mustBePositive(spec.distance, 'knockback distance');
  }

  /** Its area. */
  public describe({ kind, shape }: WithoutTimes<KnockbackSpec>): readonly AbilityDisplayStep[] {
    return [{ kind, shape }];
  }

  /** Pushes and staggers every enemy in the step's shape, in id order. */
  public apply(spec: KnockbackSpec, cast: CastContext): void {
    const { state } = cast;
    const { baseMass, travelSeconds, staggerStatusId, knockupStatusId } = this.tuning;
    const travelTicks = new TickRate(state.config.tickRate).toTicks(travelSeconds);
    for (const targetId of cast.targets(spec.shape, { team: 'enemies' })) {
      const target = state.entities.get(targetId);
      const movement = target?.findComponent(Movement);
      const position = target?.findComponent(Transform)?.position;
      if (movement !== undefined && position !== undefined) {
        const away = KnockbackEffect.awayFrom(cast.centreFor(spec.shape, position), position, cast);
        const metres = (spec.distance * baseMass) / Math.max(baseMass, movement.mass);
        if (away.x !== 0 || away.y !== 0) {
          movement.push({ x: away.x * metres, y: away.y * metres }, travelTicks);
        }
      }
      cast.statuses.apply(state, targetId, staggerStatusId, cast.casterId);
      if (spec.knockup === true) {
        cast.statuses.apply(state, targetId, knockupStatusId, cast.casterId);
      }
    }
  }

  /** The unit vector from `centre` to `position`; the cast's direction when they coincide. */
  private static awayFrom(centre: Vec2, position: Vec2, cast: CastContext): Vec2 {
    const offset = { x: position.x - centre.x, y: position.y - centre.y };
    return offset.x === 0 && offset.y === 0 ? cast.direction : normalize(offset);
  }
}
