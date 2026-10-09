import { Mob } from '../Mob';

/** A light mob (also the training dummy). Real mob behaviour belongs to SCRUM-59. */
export class LightMob extends Mob {
  /** Always `'light-mob'`. */
  public readonly kind = 'light-mob';
}
