import type { MinionMemory, MinionState } from './MinionController.types';

/** Every minion state, to read a brain's `fsm` back without a cast. */
export const MINION_STATES: readonly MinionState[] = ['marching', 'engaging', 'returning'];

/** A minion's memory before its first decision: marching, free to acquire. */
export const FRESH_MINION_MEMORY: MinionMemory = {
  fsm: 'marching',
  targetId: null,
  aggroUntilTick: 0,
  cooldownUntilTick: 0,
  leashX: 0,
  leashY: 0,
};
