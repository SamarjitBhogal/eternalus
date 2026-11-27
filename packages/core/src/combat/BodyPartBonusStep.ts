import { CombatHitbox } from '../components/CombatHitbox';
import { Transform } from '../components/Transform';
import type { BodyPartBonus } from '../content/mobs/mobs.types';
import type { GameState } from '../state/GameState';
import { cos } from '../utils/deterministicMath';
import { RADIANS_PER_DEGREE } from '../utils/geometry';
import type { DamageHit, DamageStep } from './DamageStep.types';

/**
 * The body-part bonuses on a big boss (DEC-381). On a unit with a body outline (`CombatHitbox`), a
 * hit that came from the zone behind it (`backZoneDegrees` wide, centred on the side its art shows
 * its back, `CombatHitbox.isBehind`) is multiplied by `backHit`, and a shot whose line of flight
 * crosses its head outline (`CombatHitbox.isHeadShot`) by `headShot`. When both hold, only the
 * larger applies. A hit with no path (a status tick such as bleed or burn, a collapse) comes
 * from no side, so it gets neither. Every other hit, and every unit that is only its circle,
 * passes unchanged.
 */
export class BodyPartBonusStep implements DamageStep {
  public readonly name = 'body-part-bonus';

  /** The cosine of half the zone behind the boss (`backZoneDegrees`). */
  private readonly backZoneCos: number;

  /**
   * @param bonus - The multipliers and the zone behind, from content (`BODY_PART_BONUS`).
   * @throws Error when a multiplier is not a finite number of at least 1, or the zone is not above
   *   0 and at most 180 degrees.
   */
  public constructor(private readonly bonus: BodyPartBonus) {
    for (const part of ['backHit', 'headShot'] as const) {
      if (!(Number.isFinite(bonus[part]) && bonus[part] >= 1)) {
        throw new Error(
          `BodyPartBonusStep: '${part}' needs a finite multiplier of at least 1, got ${String(bonus[part])}.`,
        );
      }
    }
    const degrees = bonus.backZoneDegrees;
    if (!(degrees > 0 && degrees <= 180)) {
      throw new Error(
        `BodyPartBonusStep: 'backZoneDegrees' needs an angle above 0 and at most 180, got ${String(degrees)}.`,
      );
    }
    this.backZoneCos = cos((degrees / 2) * RADIANS_PER_DEGREE);
  }

  /** Returns the amount times the larger bonus that holds, else the amount unchanged. */
  public adjust({ targetId, amount, path }: DamageHit, state: GameState): number {
    const target = state.entities.get(targetId);
    const hitbox = target?.findComponent(CombatHitbox);
    const body = target?.findComponent(Transform);
    if (path === undefined || hitbox === undefined || body === undefined) {
      return amount;
    }
    const { origin, impactPoint } = path;
    const { position, facing } = body;
    const isHeadShot =
      impactPoint !== undefined && hitbox.isHeadShot(origin, impactPoint, position, facing);
    const isFromBehind = hitbox.isBehind(origin, position, facing, this.backZoneCos);
    return (
      amount * Math.max(isHeadShot ? this.bonus.headShot : 1, isFromBehind ? this.bonus.backHit : 1)
    );
  }
}
