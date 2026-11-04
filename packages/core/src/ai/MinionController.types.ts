import type { LeashMemory, LeashSituation } from './LeashBehaviour.types';
import type { AggroRuleDefinition } from '../content/ai/ai.types';
import type { UnitClassifier } from './aggroRank.types';

/** A minion's state (architecture 18 §6.1). */
export type MinionState = 'marching' | 'engaging';

/** A minion's memory between decisions (18 §6.1), as it sits in its brain. */
export type MinionMemory = LeashMemory<'marching'>;

/** What `MinionController` reads besides the state, injected so it holds no content. */
export type MinionControllerContent = {
  /** Aggro profiles by id; a minion's brain names one. */
  readonly aggro: Readonly<Record<string, AggroRuleDefinition>>;
  /** Which priority class each entity kind belongs to. */
  readonly classOf: UnitClassifier;
};

/** Everything one decision reads, gathered once. */
export type MinionSituation = LeashSituation;
