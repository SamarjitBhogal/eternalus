import type { EntityFamily } from '../entities/Entity.types';
import type { EntityId } from '../state/EntityStore.types';
import type { GameState } from '../state/GameState';
import type { ScoreBook } from '../state/ScoreBook';
import type { Team } from '../teams/teams.types';

/** One buffered event, applied to the match's `ScoreBook` by `Scoring.fold`. */
export type PendingChange = (book: ScoreBook) => void;

/**
 * A Legend's hit on an enemy unit, as `Scoring` buffered it: the target's team is read at the
 * event, while the target is still in the store.
 */
export type ScoredHit = {
  readonly targetId: EntityId;
  readonly attackerId: EntityId;
  /** The damage, the part shield bars absorbed included (DEC-123). */
  readonly amount: number;
  readonly tick: number;
};

/**
 * A unit's death, as `Scoring` buffered it: the victim's kind and team are read at the event,
 * while it is still in the store.
 */
export type ScoredDeath = {
  readonly victimId: EntityId;
  readonly kind: string;
  readonly team: Team | undefined;
  readonly killerId: EntityId | null;
  readonly tick: number;
};

/**
 * What a hit on a unit of one family scores (architecture 12 §5). `Scoring` calls it at the fold,
 * only for a Legend attacker on another team than the target.
 */
export interface HitRule {
  /** Writes what `hit` earns to `book`. */
  score(book: ScoreBook, hit: ScoredHit): void;
}

/**
 * What the death of a unit of one family scores (12 §5, DEC-211 (3)). `Scoring` calls it at the
 * fold, for every death of that family.
 */
export interface DeathRule {
  /** Writes what `death` earns to `book`. */
  score(book: ScoreBook, death: ScoredDeath): void;
}

/**
 * A scoring rule for events other than hits and deaths (12 §5): it subscribes to its own events,
 * buffers what they earn through `Scoring`'s `defer`, and can score once per fold.
 */
export interface ScoringListener {
  /**
   * Subscribes to `state`'s events. A change given to `defer` is applied at the next fold; once
   * the match has a result, `defer` drops it. `Scoring`'s constructor calls it once.
   */
  listen(state: GameState, defer: (change: PendingChange) => void): void;
  /**
   * Writes what the tick itself earns (held time). `Scoring` calls it once per fold, after the
   * buffered changes, while the match has no result.
   */
  scoreTick(book: ScoreBook): void;
}

/**
 * The rules `Scoring` applies (12 §5): one registry for hits and one for deaths, by the target's
 * or victim's family (a family with no entry scores nothing, DEC-211 (3)), and the listeners.
 * `defaultScoringRules.ts` builds them.
 */
export type ScoringRules = {
  readonly hits: Readonly<Partial<Record<EntityFamily, HitRule>>>;
  readonly deaths: Readonly<Partial<Record<EntityFamily, DeathRule>>>;
  /** Folded in list order, after the buffered changes. */
  readonly listeners: readonly ScoringListener[];
};
