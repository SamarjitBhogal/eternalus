import type { MobKind } from '../content/mobs/mobs.types';
import type { EntityFamily } from '../entities/Entity.types';
import type { GameEventMap } from '../state/GameEvents.types';
import type { GameState } from '../state/GameState';
import type { ScoreBook } from '../state/ScoreBook';
import { isPlayableTeam, opponentOf } from '../teams/playableTeams';
import { TickRate } from '../utils/TickRate';
import type { DirectorContext } from './DirectorContext.types';
import type { ScoreKeeper } from './ScoreKeeper.types';
import type {
  DeathRule,
  HitRule,
  PendingChange,
  ScoredDeath,
  ScoredHit,
  ScoringOptions,
} from './Scoring.types';

/**
 * The scoring rules (architecture 12 §5, DEC-79): what spawns, hits, deaths and destroyed
 * structures earn each Legend and each team. Its listeners only buffer what they saw, reading the
 * entity's family, kind and team while it is still in the store; `fold` applies the buffer in the
 * director's pass, after `DeathSystem`, so a kill on the ending tick counts. It writes only
 * through the match's `ScoreBook` (`state.match.scoreBook`, DEC-211), whose data is hashed and
 * replayed. Once the match has a result it buffers nothing.
 *
 * - Rules: the target's or victim's family picks its rule from a registry (DEC-211 (3)); a family
 *   with no entry (bosses, the sovereign and the rest) scores nothing.
 * - Rows: one per Legend, from its `entity-spawned`. A row keeps its data after the Legend dies or
 *   leaves the store.
 * - Kills: only a Legend attacker (one with a row) earns a kill. A hit names its attacker (05 §9),
 *   so a projectile's hit counts for the Legend that fired it, even after that Legend died.
 * - Own side: a hit on or a kill of a unit on the attacker's own team (itself included) counts for
 *   nothing, as for XP (DEC-130; O5, 05 §18). The victim's death still counts.
 * - Assists: Legend victims only. Every other Legend that hit the victim inside the window earns
 *   one, also when a non-Legend landed the last hit.
 * - Mobs: points by weight class, for enemy team mobs (Host units and tower guards, DEC-211 (2))
 *   and neutral mobs.
 * - Structures: a structure of a playable team that falls gives the opposing team team-only
 *   points, whoever landed the last hit, as for structure XP (DEC-212, DEC-186). A neutral camp
 *   gives nothing.
 */
export class Scoring implements ScoreKeeper {
  private readonly pending: PendingChange[] = [];
  private readonly assistWindowTicks: number;
  /** What a hit scores, by the target's family. */
  private readonly hitRules: Readonly<Partial<Record<EntityFamily, HitRule>>> = {
    legend: (book, { targetId, attackerId, tick }) => {
      book.recordHit(targetId, attackerId, tick);
    },
    structure: (book, { attackerId, amount }) => {
      book.award(attackerId, { counter: 'structureDamage', by: amount, points: 0 });
    },
  };
  /** What a death scores, by the victim's family. */
  private readonly deathRules: Readonly<Partial<Record<EntityFamily, DeathRule>>> = {
    legend: (book, death) => {
      this.legendDied(book, death);
    },
    mob: (book, death) => {
      this.mobDied(book, death);
    },
  };

  /**
   * @param state - The match whose events this listens to. Build it before anything spawns, so
   *   every Legend gets a row.
   * @param options - The points and the assist window.
   */
  public constructor(
    private readonly state: GameState,
    private readonly options: ScoringOptions,
  ) {
    this.assistWindowTicks = new TickRate(state.config.tickRate).toTicks(
      options.assistWindowSeconds,
    );
    state.events.on('entity-spawned', (payload) => {
      this.onSpawned(payload);
    });
    state.events.on('damage-applied', (payload) => {
      this.onHit(payload);
    });
    state.events.on('entity-died', (payload) => {
      this.onDied(payload);
    });
    state.events.on('structure-destroyed', (payload) => {
      this.onStructureDestroyed(payload);
    });
  }

  /** Applies this tick's buffered events in order. Called by the `MatchDirector`, once per tick. */
  public fold({ state }: DirectorContext): void {
    for (const change of this.pending.splice(0)) {
      change(state.match.scoreBook);
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
   * Buffers a hit on a target whose family has a hit rule: a Legend (for assists) or a structure
   * (for `structureDamage`, which counts the damage its shield bars absorbed too: DEC-123).
   */
  private onHit({
    targetId,
    amount,
    absorbed,
    source: { attackerId },
  }: GameEventMap['damage-applied']): void {
    const target = this.state.entities.get(targetId);
    const rule = target === undefined ? undefined : Scoring.ruleFor(this.hitRules, target.family);
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
        rule(book, hit);
      }
    });
  }

  /** Buffers a death whose victim's family has a death rule, with the victim's kind and team. */
  private onDied({ entityId, killer: { attackerId } }: GameEventMap['entity-died']): void {
    const victim = this.state.entities.get(entityId);
    const rule = victim === undefined ? undefined : Scoring.ruleFor(this.deathRules, victim.family);
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
      rule(book, death);
    });
  }

  /** Buffers the opposing team's points for a fallen structure of a playable team (DEC-212). */
  private onStructureDestroyed({ team }: GameEventMap['structure-destroyed']): void {
    if (!isPlayableTeam(team)) {
      return;
    }
    const destroyer = opponentOf(team);
    const points = this.options.weights.structureDestroyed;
    this.defer((book) => {
      book.awardTeam(destroyer, { counter: 'structuresDestroyed', by: 1, points });
    });
  }

  /** Buffers `change` until the next fold; nothing once the match has a result. */
  private defer(change: PendingChange): void {
    if (this.state.match.result === null) {
      this.pending.push(change);
    }
  }

  /** The victim's death; the killer's kill on an enemy; every other recent hitter's assist. */
  private legendDied(book: ScoreBook, { victimId, team, killerId, tick }: ScoredDeath): void {
    const { weights } = this.options;
    if (book.rowOf(victimId) !== undefined) {
      book.award(victimId, { counter: 'deaths', by: 1, points: weights.death });
    }
    const killer = killerId === null ? undefined : book.rowOf(killerId);
    if (killer !== undefined && killer.team !== team) {
      book.award(killer.entityId, { counter: 'kills', by: 1, points: weights.legendKill });
    }
    for (const helperId of book.takeAssists(victimId, tick, this.assistWindowTicks)) {
      if (helperId !== killerId) {
        book.award(helperId, { counter: 'assists', by: 1, points: weights.legendKillAssist });
      }
    }
  }

  /** A Legend's last hit on an enemy team mob or a neutral mob, scored by its weight class. */
  private mobDied(book: ScoreBook, { kind, team, killerId }: ScoredDeath): void {
    const killer = killerId === null ? undefined : book.rowOf(killerId);
    if (killer === undefined || killer.team === team || !this.isMobKind(kind)) {
      return;
    }
    book.award(killer.entityId, {
      counter: team === 'neutral' ? 'neutralKills' : 'minionKills',
      by: 1,
      points: this.options.weights.minionKill[kind],
    });
  }

  private isMobKind(kind: string): kind is MobKind {
    return Object.hasOwn(this.options.weights.minionKill, kind);
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
