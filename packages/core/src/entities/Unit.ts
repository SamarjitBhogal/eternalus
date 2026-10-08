import { Entity } from './Entity';

/** Abstract base for entities of the `unit` family. */
export abstract class Unit extends Entity {
  /** Always `'unit'`. */
  public override get family(): string {
    return 'unit';
  }

  /**
   * @param id - Unique id of this entity instance.
   * @param definitionId - Content definition this entity was built from.
   */
  public constructor(id: string, definitionId: string) {
    if (new.target === Unit) {
      throw new Error('Unit is abstract and cannot be instantiated directly.');
    }

    super(id, definitionId);
  }
}
