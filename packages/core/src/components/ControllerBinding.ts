import type { AiMemory, ControllerId } from '../content/ai/ai.types';

/**
 * Which controller drives an entity and which AI profile it reads (architecture 11 §2), copied
 * from the definition at spawn or given by the spawn itself, with the memory its brain starts
 * with. Static: what the controller remembers lives in the entity's
 * brain in `state.ai`, never here.
 */
export class ControllerBinding {
  /**
   * @param controllerId - The definition's `controller`, or the spawn's.
   * @param profileId - The definition's `aiProfile` (or the controller id), or the spawn's.
   * @param initialMemory - The brain's memory before its first decision.
   */
  public constructor(
    public readonly controllerId: ControllerId,
    public readonly profileId: string,
    public readonly initialMemory: AiMemory = {},
  ) {}
}
