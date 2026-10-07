import { Unit } from './Unit';

/** Abstract base for entities of the `mob` family. */
export abstract class Mob extends Unit {
  /** Always `'mob'`. */
  public override get family(): string {
    return 'mob';
  }

  /**
   * @param id - Unique id of this entity instance.
   * @param definitionId - Content definition this entity was built from.
   */
  public constructor(id: string, definitionId: string) {
    if (new.target === Mob) {
      throw new Error('Mob is abstract and cannot be instantiated directly.');
    }

    super(id, definitionId);
  }
}
