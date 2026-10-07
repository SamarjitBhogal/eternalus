import type { LegendKind } from '../content/legends/legends.types';
import type { EntityFamily } from './Entity.types';
import { Unit } from './Unit';

/** Abstract base for entities of the `legend` family. */
export abstract class Legend extends Unit {
  /** The content kind of this class; one of `LegendKind`. */
  public abstract override readonly kind: LegendKind;

  /** Always `'legend'`. */
  public readonly family: EntityFamily = 'legend';

  /**
   * @param id - Unique id of this entity instance.
   * @param definitionId - Content definition this entity was built from.
   */
  public constructor(id: string, definitionId: string) {
    if (new.target === Legend) {
      throw new Error('Legend is abstract and cannot be instantiated directly.');
    }

    super(id, definitionId);
  }
}
