import { PassivePhase } from './PassivePhase';

/** The early game (architecture 12 §2): tower waves and camps run on `Spawner` data, not phase rules. */
export class EarlyGamePhase extends PassivePhase {
  public readonly phase = 'early-game';
}
