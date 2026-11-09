import type { ScoringWeights } from '../content/match/scoring.types';
import type { EntityId } from '../state/EntityStore.types';
import type { ScoreBook } from '../state/ScoreBook';
import type { Team } from '../teams/teams.types';

/** The content values `Scoring` counts with; `Simulation` passes them in (12 §1, rule 11). */
export type ScoringOptions = {
  /** The points per kill, assist, death and destroyed structure (`content/match/scoring.ts`). */
  readonly weights: ScoringWeights;
  /** How long a hit on an enemy Legend still earns an assist, in seconds. */
  readonly assistWindowSeconds: number;
};

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
 * What a hit on a unit of one family scores (12 §5). Called at the fold, only for a Legend
 * attacker on another team than the target.
 */
export type HitRule = (book: ScoreBook, hit: ScoredHit) => void;

/** What the death of a unit of one family scores (12 §5, DEC-211 (3)); called at the fold. */
export type DeathRule = (book: ScoreBook, death: ScoredDeath) => void;
