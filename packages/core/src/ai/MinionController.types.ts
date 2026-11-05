import type { HordeAggroRuleDefinition } from '../content/ai/ai.types';
import type { LeashSituation } from './LeashBehaviour.types';

/** A minion's state (architecture 18 §6.1). */
export type MinionState = 'marching' | 'engaging';

/** Everything one decision reads, gathered once. */
export type MinionSituation = LeashSituation<HordeAggroRuleDefinition>;
