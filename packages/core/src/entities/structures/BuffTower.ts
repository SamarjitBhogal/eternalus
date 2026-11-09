import { Structure } from './Structure';

/** A second-line tower; it sends medium hordes and its loss opens its team's walls and gates (architecture 07 §1). */
export class BuffTower extends Structure {
  /** Always `'buff-tower'`. */
  public readonly kind = 'buff-tower';
}
