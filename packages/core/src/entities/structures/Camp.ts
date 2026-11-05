import { Structure } from './Structure';

/**
 * A neutral forest camp (architecture 07 §1, 18 §7.1): the home of a group of camp mobs, which
 * its guard plan spawns once the countdown ends and respawns after the group is cleared. It never
 * takes damage (its rule is `never`).
 */
export class Camp extends Structure {
  /** Always `'camp'`. */
  public readonly kind = 'camp';
}
