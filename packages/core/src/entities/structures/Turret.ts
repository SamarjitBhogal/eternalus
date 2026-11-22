import { Structure } from './Structure';

/**
 * A wall turret on a Stronghold's wall ring (architecture 07 §1, §5): its definition names the
 * `TurretController`, which picks its target and ammo and aims ahead of a moving target. Its
 * blocking map object is its body (one health pool).
 */
export class Turret extends Structure {
  /** Always `'turret'`. */
  public readonly kind = 'turret';
}
