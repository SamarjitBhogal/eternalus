import type { MinionState } from './MinionController.types';

/** Every minion state, to read a brain's `fsm` back without a cast. */
export const MINION_STATES: readonly MinionState[] = ['marching', 'engaging', 'returning'];
