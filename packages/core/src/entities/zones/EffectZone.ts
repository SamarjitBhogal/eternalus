import { Zone } from '../Zone';

/** A transient nonblocking spell area; its runtime component supplies lifetime and effects. */
export class EffectZone extends Zone {
  public readonly kind = 'effect-zone';
}
