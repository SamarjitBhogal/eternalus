import type { GuardState } from './GuardController.types';

/** Every guard state, to read a brain's `fsm` back without a cast. */
export const GUARD_STATES: readonly GuardState[] = ['holding', 'engaging', 'returning'];
