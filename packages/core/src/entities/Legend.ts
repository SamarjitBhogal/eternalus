import { Unit } from './Unit';

/** Abstract base for entities of the `legend` family. */
export abstract class Legend extends Unit {
  /** Always `'legend'`. */
  public override get family(): string {
    return 'legend';
  }

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
