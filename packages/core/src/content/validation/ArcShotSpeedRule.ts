import type { AuthoredProjectile } from '../projectiles/projectiles.types';
import type { ContentRule } from './ContentValidator.types';

/**
 * An arc shot flies at full speed until it lands (DEC-342): its `slowFrom` must equal its `range`.
 * A turret leads its target by the flight time at full speed (`predictiveAim`), so a shot that
 * slowed on the way would land behind a moving target.
 */
export class ArcShotSpeedRule implements ContentRule<AuthoredProjectile> {
  /** Flags an arc projectile (`isArc`) whose `slowFrom` is not its `range`. */
  public check({ isArc, slowFrom, range }: AuthoredProjectile): readonly string[] {
    return isArc === true && slowFrom !== range
      ? ['an arc shot needs slowFrom equal to range']
      : [];
  }
}
