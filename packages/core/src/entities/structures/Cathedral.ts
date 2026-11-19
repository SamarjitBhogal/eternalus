import { Structure } from './Structure';

/**
 * The middle capture point's building (architecture 07 §1), placed on the gem at its centre:
 * neutral, targetable, and never damaged (its rule is `never`, DISC-11). The gem's `Spawner`,
 * `Aura` and lightning on attackers arrive later.
 */
export class Cathedral extends Structure {
  /** Always `'cathedral'`. */
  public readonly kind = 'cathedral';
}
