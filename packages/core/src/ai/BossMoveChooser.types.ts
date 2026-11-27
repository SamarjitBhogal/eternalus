import type { BossMoveDefinition } from '../content/ai/ai.types';
import type { EntityId } from '../state/EntityStore.types';
import type { Vec2 } from '../utils/geometry.types';
import type { BossTurn } from './BossController.types';

/** A living non-neutral unit inside the boss's zone, and its distance from the boss. */
export type BossTarget = { readonly id: EntityId; readonly at: Vec2; readonly gap: number };

/** The move a boss starts, the unit it aims at, and the tick the move lands. */
export type BossChoice = {
  readonly move: BossMoveDefinition;
  readonly target: BossTarget;
  readonly landTick: number;
};

/**
 * What the situation tree reads and writes in one decision: a branch's condition sets `target`,
 * its action sets `choice`.
 */
export type BossSight = {
  readonly turn: BossTurn;
  /** Every target in the zone, nearest first; ties go to the lower id. */
  readonly targets: readonly BossTarget[];
  target: BossTarget | null;
  choice: BossChoice | null;
};
