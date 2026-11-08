import { PassivePhase } from './PassivePhase';

/** The quarter mark (architecture 12 §2): its mini-bosses come from a timeline action, not phase rules. */
export class QuarterMarkPhase extends PassivePhase {
  public readonly phase = 'quarter-mark';
}
