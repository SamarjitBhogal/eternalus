import type { AiMemory, ControllerId } from '../content/ai/ai.types';

/**
 * A controller given to one entity at spawn, in place of its definition's (architecture 11 §2,
 * 18 §8): a bot Legend's `bot-legend` controller, its difficulty and its lane in `memory`.
 */
export type ControllerSpawn = {
  readonly controllerId: ControllerId;
  readonly profileId: string;
  /** The brain's memory before its first decision. */
  readonly memory: AiMemory;
};
