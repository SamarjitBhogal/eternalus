import { Structure } from './Structure';

/** A wall-ring gate on a lane; unbreakable until enough of its team's BuffTowers are down (architecture 07 §1). */
export class Gate extends Structure {
  /** Always `'gate'`. */
  public readonly kind = 'gate';
}
