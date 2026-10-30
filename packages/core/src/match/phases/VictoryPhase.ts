import { PassivePhase } from './PassivePhase';

/** Victory, a terminal phase (architecture 12 §2): only a verdict enters it, never the timeline. */
export class VictoryPhase extends PassivePhase {
  public readonly phase = 'victory';
}
