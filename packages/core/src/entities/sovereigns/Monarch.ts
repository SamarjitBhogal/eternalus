import { Sovereign } from '../Sovereign';

/** The Citadel's Emperor, the Sovereign used by the main match (DEC-74). */
export class Monarch extends Sovereign {
  /** Always `'monarch'`. */
  public readonly kind = 'monarch';
}
