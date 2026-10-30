import type { ControllerId } from '../content/ai/ai.types';

/**
 * Which controller drives an entity and which AI profile it reads (architecture 11 §2), copied
 * from the definition at spawn. Static: what the controller remembers lives in the entity's
 * brain in `state.ai`, never here.
 */
export class ControllerBinding {
  /**
   * @param controllerId - The definition's `controller`.
   * @param profileId - The definition's `aiProfile`, or the controller id.
   */
  public constructor(
    public readonly controllerId: ControllerId,
    public readonly profileId: string,
  ) {}
}
