import { Mob } from '../Mob';

/** A light mob (also the training dummy). No kind-specific behaviour yet. */
export class LightMob extends Mob {
  public readonly kind = 'light-mob';
}
