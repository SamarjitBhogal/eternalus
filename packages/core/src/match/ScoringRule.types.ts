import type { EntityFamily } from '../entities/Entity.types';
import type { EntityId } from '../state/EntityStore.types';
import type { GameEvents } from '../state/GameEvents';
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
 * A scoring rule for events other than hits and deaths (12 §5, DEC-223 (1)): it subscribes to its
 * own events and buffers what they earn through `Scoring`'s `defer`. It gets the event bus only,
 * so it writes the `ScoreBook` only through `defer`, at the fold (DEC-211).
 */
export interface ScoringListener {
  /**
   * Subscribes to `events`. A change given to `defer` is applied at the next fold; once the match
   * has a result, `defer` drops it. `Scoring`'s constructor calls it once.
   */
  listen(events: GameEvents, defer: (change: PendingChange) => void): void;
}

/**
 * A scoring rule for what the tick itself earns, such as held time (12 §5, DEC-223 (1)).
 */
export interface TickScorer {
  /**
   * Writes what this tick earns to `book`, reading `state` as it stands at the fold. `Scoring`
   * calls it once per fold, after the buffered changes, while the match has no result.
   */
  scoreTick(book: ScoreBook, state: GameState): void;
}

/**
 * The rules `Scoring` applies (12 §5): one registry for hits and one for deaths, by the target's
 * or victim's family (a family with no entry scores nothing, DEC-211 (3)), the listeners and the
 * tick scorers. `defaultScoringRules.ts` builds them.
 */
export type ScoringRules = {
  readonly hits: Readonly<Partial<Record<EntityFamily, HitRule>>>;
  readonly deaths: Readonly<Partial<Record<EntityFamily, DeathRule>>>;
  /** Subscribed in list order when `Scoring` is built. */
  readonly listeners: readonly ScoringListener[];
  /** Folded in list order, after the buffered changes, while the match has no result. */
  readonly tickScorers: readonly TickScorer[];
};
