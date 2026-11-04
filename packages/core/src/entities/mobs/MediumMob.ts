import { Mob } from '../Mob';

/** A medium mob: the medium lane minion (architecture 18, entity legend). */
export class MediumMob extends Mob {
  /** Always `'medium-mob'`. */
  public readonly kind = 'medium-mob';
}
