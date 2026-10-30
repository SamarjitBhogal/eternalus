import { Mob } from '../Mob';

/** A heavy mob: the heavy lane minion (architecture 18, entity legend). */
export class HeavyMob extends Mob {
  /** Always `'heavy-mob'`. */
  public readonly kind = 'heavy-mob';
}
