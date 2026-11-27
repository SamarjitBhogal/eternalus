import { EnterPhaseAction } from './actions/EnterPhaseAction';
import { SummonGreaterBossAction } from './actions/SummonGreaterBossAction';
import type { TimelineActionRegistry } from './TimelineActionRegistry.types';

/** The timeline action registry: one line per action kind (architecture 12 §3, 02 §9). */
export const createDefaultTimelineActions = (): TimelineActionRegistry => ({
  'enter-phase': new EnterPhaseAction(),
  'summon-greater-boss': new SummonGreaterBossAction(),
});
