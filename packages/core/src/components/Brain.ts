/**
 * Marks an entity as driven by a controller (architecture 11 §2): `AiSystem` asks the
 * controller registered under `controllerId` what this entity does next.
 *
 * @remarks Prototype: doc 11 keeps brains as plain data in `state.ai.brains` with memory and an
 * RNG stream. The follow-leader prototype is stateless, so only the controller id is needed.
 */
export class Brain {
  /**
   * @param controllerId - The kebab-case id of the controller that decides for this entity.
   * @throws Error when `controllerId` is empty.
   */
  public constructor(public readonly controllerId: string) {
    if (controllerId.length === 0) {
      throw new Error('Brain controllerId must not be empty.');
    }
  }
}
