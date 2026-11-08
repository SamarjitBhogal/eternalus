import { PassivePhase } from './PassivePhase';

/** Defeat, a terminal phase (architecture 12 §2): only a verdict enters it, never the timeline. */
export class DefeatPhase extends PassivePhase {
  public readonly phase = 'defeat';
}
