import { Zone } from '../Zone';

/** A non-colliding ability area; its healing/channel component supplies its behavior. */
export class AbilityField extends Zone {
  public readonly kind = 'ability-field';
}
