import type { EntityFamily } from '../entities/Entity.types';
import type { GameEventMap } from '../state/GameEvents.types';
import type { GameState } from '../state/GameState';
import type { DirectorContext } from './DirectorContext.types';
import type { ScoreKeeper } from './ScoreKeeper.types';
import type { PendingChange, ScoredDeath, ScoredHit, ScoringRules } from './ScoringRule.types';

/**
 * Scoring (architecture 12 §5, DEC-79): applies the injected rules (`defaultScoringRules.ts`) to
 * what spawns, hits, deaths, the listener rules' events and each tick earn each Legend and each
 * team. Its listeners only buffer what they saw, reading the entity's family, kind and team while
 * it is still in the store; `fold` applies the buffer in the director's pass, after
 * `DeathSystem` and `CaptureSystem`, so a kill on the ending tick counts. It writes only through
 * the match's `ScoreBook` (`state.match.scoreBook`, DEC-211), whose data is hashed and replayed.
 * Once the match has a result it counts nothing.
 *
 * - Rows: one per Legend, from its `entity-spawned`. A row keeps its data after the Legend dies or
 *   leaves the store.
 * - Hits and deaths: the target's or victim's family picks its rule from a registry (DEC-211 (3));
 *   a family with no entry (bosses, the sovereign and the rest) scores nothing.
 * - Own side: a hit scores only for an attacker with a row (a Legend) on another team than the
 *   target, so a hit on a unit of its own team, itself included, counts for nothing, as for XP
 *   (DEC-130; O5, 05 §18). A hit names its attacker (05 §9), so a projectile's hit counts for the
 *   Legend that fired it, even after that Legend died.
 * - Listener rules: each subscribes to its own events on the bus when `Scoring` is built and
 *   buffers through `defer` (DEC-223 (1)).
 * - Tick scorers: each scores the tick itself after the buffered changes of each fold, while the
 *   match has no result (held time, DEC-223 (1)).
 */
export class Scoring implements ScoreKeeper {
  /**
   * The tick's buffered changes, kept outside the hashed state. That is safe only while the
   * director's fold runs after every system that emits a scored event (the order in
   * `DefaultSystemPipeline`): the buffer is then empty between ticks.
   */
  private readonly pending: PendingChange[] = [];

  /**
   * @param state - The match whose events this listens to. Build it before anything spawns, so
   *   every Legend gets a row.
   * @param rules - The hit, death, listener and tick rules (`createDefaultScoringRules`).
   */
  public constructor(
    private readonly state: GameState,
    private readonly rules: ScoringRules,
  ) {
    state.events.on('entity-spawned', (payload) => {
      this.onSpawned(payload);
    });
    state.events.on('damage-applied', (payload) => {
      this.onHit(payload);
    });
    state.events.on('entity-died', (payload) => {
      this.onDied(payload);
    });
    for (const listener of rules.listeners) {
      listener.listen(state.events, (change) => {
        this.defer(change);
      });
    }
  }

  /**
   * Applies this tick's buffered events in order, then lets each tick scorer score the tick.
   * Called by the `MatchDirector`, once per tick.
   */
  public fold({ state }: DirectorContext): void {
    const book = state.match.scoreBook;
    for (const change of this.pending.splice(0)) {
      change(book);
    }
    if (state.match.result === null) {
      for (const scorer of this.rules.tickScorers) {
        scorer.scoreTick(book, state);
      }
    }
  }

  /**
   * Buffers a row for a Legend on a playable team; whether it is the human's is read at the fold.
   * A Legend that already has a row keeps it (`ScoreBook.addRow`).
   */
  private onSpawned({ entityId, team }: GameEventMap['entity-spawned']): void {
    const legend = this.state.entities.get(entityId);
    if (legend?.family !== 'legend' || team === 'neutral') {
      return;
    }
    const classId = legend.definitionId;
    this.defer((book) => {
      const controller = entityId === this.state.match.humanLegendId ? 'human' : 'bot';
      book.addRow({ entityId, team, classId, controller });
    });
  }

  /**
   * Buffers a hit on a target whose family has a hit rule, with the damage its shield bars
   * absorbed included (DEC-123); at the fold it counts only for an attacker with a row on another
   * team than the target.
   */
  private onHit({
    targetId,
    amount,
    absorbed,
    source: { attackerId },
  }: GameEventMap['damage-applied']): void {
    const target = this.state.entities.get(targetId);
    const rule = target === undefined ? undefined : Scoring.ruleFor(this.rules.hits, target.family);
    if (attackerId === null || rule === undefined) {
      return;
    }
    const targetTeam = this.state.entities.teamOf(targetId);
    const hit: ScoredHit = {
      targetId,
      attackerId,
      amount: amount + absorbed,
      tick: this.state.tick,
    };
    this.defer((book) => {
      const attacker = book.rowOf(attackerId);
      if (attacker !== undefined && attacker.team !== targetTeam) {
        rule.score(book, hit);
      }
    });
  }

  /** Buffers a death whose victim's family has a death rule, with the victim's kind and team. */
  private onDied({ entityId, killer: { attackerId } }: GameEventMap['entity-died']): void {
    const victim = this.state.entities.get(entityId);
    const rule =
      victim === undefined ? undefined : Scoring.ruleFor(this.rules.deaths, victim.family);
    if (victim === undefined || rule === undefined) {
      return;
    }
    const death: ScoredDeath = {
      victimId: entityId,
      kind: victim.kind,
      team: this.state.entities.teamOf(entityId),
      killerId: attackerId,
      tick: this.state.tick,
    };
    this.defer((book) => {
      rule.score(book, death);
    });
  }

  /** Buffers `change` until the next fold; nothing once the match has a result. */
  private defer(change: PendingChange): void {
    if (this.state.match.result === null) {
      this.pending.push(change);
    }
  }

  /** The rule `rules` holds for `family` (a string on `Entity`), looked up as an own key only. */
  private static ruleFor<Rule>(
    rules: Readonly<Partial<Record<EntityFamily, Rule>>>,
    family: string,
  ): Rule | undefined {
    // Safe: `hasOwn` just found the family among the registry's keys.
    return Object.hasOwn(rules, family) ? rules[family as EntityFamily] : undefined;
  }
}
