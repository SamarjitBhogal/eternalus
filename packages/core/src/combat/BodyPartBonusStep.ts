import { CombatHitbox } from '../components/CombatHitbox';
import { Transform } from '../components/Transform';
import type { BodyPartBonus } from '../content/mobs/mobs.types';
import type { GameState } from '../state/GameState';
import { dot, sub } from '../utils/vec2';
import type { DamageHit, DamageStep } from './DamageStep.types';

/**
 * The body-part bonuses on a big boss (DEC-381). On a unit with a body outline (`CombatHitbox`), a
 * hit from an attacker in its rear half (more than 90 degrees from its facing) is multiplied by
 * `backHit`, and a hit whose impact point is on its head outline (only a projectile hit has an
 * impact point) by `headShot`. When both hold, only the larger applies. Every other hit, and every
 * unit that is only its circle, passes unchanged.
 */
export class BodyPartBonusStep implements DamageStep {
  public readonly name = 'body-part-bonus';

  /**
   * @param bonus - The multipliers, from content (`BODY_PART_BONUS`).
   * @throws Error when a multiplier is not a finite number of at least 1.
   */
  public constructor(private readonly bonus: BodyPartBonus) {
    for (const [part, multiplier] of Object.entries(bonus)) {
      if (!(Number.isFinite(multiplier) && multiplier >= 1)) {
        throw new Error(
          `BodyPartBonusStep: '${part}' needs a finite multiplier of at least 1, got ${String(multiplier)}.`,
        );
      }
    }
  }

  /** Returns the amount times the larger bonus that holds, else the amount unchanged. */
  public adjust({ targetId, amount, source, impactPoint }: DamageHit, state: GameState): number {
    const target = state.entities.get(targetId);
    const hitbox = target?.findComponent(CombatHitbox);
    const body = target?.findComponent(Transform);
    if (hitbox === undefined || body === undefined) {
      return amount;
    }
    const { position, facing } = body;
    const isHeadShot = impactPoint !== undefined && hitbox.isOnHead(impactPoint, position, facing);
    const attacker =
      source.attackerId === null
        ? undefined
        : state.entities.get(source.attackerId)?.findComponent(Transform);
    // The rear half: a negative dot product of the facing and the way to the attacker, so no
    // angle and no trigonometry (ADR 0012).
    const isFromBehind =
      attacker !== undefined && dot(facing, sub(attacker.position, position)) < 0;
    return (
      amount * Math.max(isHeadShot ? this.bonus.headShot : 1, isFromBehind ? this.bonus.backHit : 1)
    );
  }
}
