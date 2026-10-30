import { PassivePhase } from './PassivePhase';

/** The end game (architecture 12 §2): a marker for the announcer and late-game rules. */
export class EndGamePhase extends PassivePhase {
  public readonly phase = 'end-game';
}
