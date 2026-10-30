import { Structure } from './Structure';

/** The capital: its death ends the match; it sends the opening hordes and the heavy hordes (architecture 07 §1). */
export class Stronghold extends Structure {
  /** Always `'stronghold'`. */
  public readonly kind = 'stronghold';
}
