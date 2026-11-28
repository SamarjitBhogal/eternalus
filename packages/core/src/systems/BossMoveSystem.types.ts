import type { BossMoveEffectId, BossMoveOf } from '../content/ai/ai.types';
import type { EntityId } from '../state/EntityStore.types';
import type { GameState } from '../state/GameState';
import type { Vec2 } from '../utils/geometry.types';

/** What a boss move effect gets when its move lands, built by `BossMoveSystem`. */
export type BossMoveLanding = {
  readonly state: GameState;
  readonly bossId: EntityId;
  /** The boss's centre. */
  readonly at: Vec2;
  /** The way the boss faces: a unit vector. */
  readonly facing: Vec2;
  /** The living non-neutral units whose centres are within `radius` of the boss, in id order. */
  readonly unitsWithin: (radius: number) => readonly EntityId[];
  /** Hits `targetId` for `damage` from the boss's move, through the damage pipeline. */
  readonly strike: (targetId: EntityId, damage: number) => void;
};

/** Lands one kind of boss move (architecture 11 §4.6's `AbilityEffect` strategy, interim). */
export interface BossMoveEffect<K extends BossMoveEffectId> {
  /** Applies `move`'s effect on its landing tick. */
  land(move: BossMoveOf<K>, landing: BossMoveLanding): void;
}

/** One strategy per boss move effect id. */
export type BossMoveEffects = { readonly [K in BossMoveEffectId]: BossMoveEffect<K> };
