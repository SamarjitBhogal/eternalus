import type { BossProfileDefinition } from '../content/ai/ai.types';
import type { AiMemory } from '../state/AiState.types';
import type { EntityId } from '../state/EntityStore.types';
import type { GameState } from '../state/GameState';
import type { Vec2 } from '../utils/geometry.types';
import type { SeededRandom } from '../utils/SeededRandom';
import type { Command } from '../commands/Command.types';
import type { Perception } from './perception/Perception';

/**
 * A boss's state (architecture 11 §4.6): the entrance roar, then `roam → telegraph → execute →
 * recover → roam`.
 */
export type BossState = 'entrance' | 'roam' | 'telegraph' | 'execute' | 'recover';

/** The circle a boss stays in: its post's home edge plus its leash. */
export type BossZone = { readonly x: number; readonly y: number; readonly radius: number };

/** One decision's inputs, gathered once. */
export type BossTurn = {
  readonly state: GameState;
  readonly id: EntityId;
  readonly memory: AiMemory;
  readonly profile: BossProfileDefinition;
  readonly zone: BossZone;
  readonly at: Vec2;
  readonly perception: Perception;
  readonly rng: SeededRandom;
  /** Seconds to ticks at the match's tick rate. */
  readonly ticks: (seconds: number) => number;
};

/** One FSM step's result. */
export type BossStep = { readonly commands: readonly Command[]; readonly memory: AiMemory };
