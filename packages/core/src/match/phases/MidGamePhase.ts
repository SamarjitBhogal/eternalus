import { PassivePhase } from './PassivePhase';

/** Mid-game (architecture 12 §2): the gem erupts by timeline action; the atmosphere rule comes later. */
export class MidGamePhase extends PassivePhase {
  public readonly phase = 'mid-game';
}
