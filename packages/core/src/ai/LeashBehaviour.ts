import type { AggroRuleDefinition } from '../content/ai/ai.types';
import type { AiMemory } from '../state/AiState.types';
import { countdownEndTick } from '../state/countdownEndTick';
import type { EntityId } from '../state/EntityStore.types';
import type { MutableVec2 } from '../utils/vec2.types';
import { aggroRank } from './aggroRank';
import type { UnitClassifier } from './aggroRank.types';
import type {
  LeashCandidate,
  LeashMemory,
  LeashRules,
  LeashSituation,
  LeashStep,
} from './LeashBehaviour.types';

/**
 * The acquire and engage logic every leashed mob shares (architecture 18 §6.1, §7;
 * MS-36, DEC-144: "distance, then time"). It takes the best-ranked enemy in reach (priority, then
 * distance, then id) and emits one `attack-target`, anchoring its leash where it stands; a
 * mate's attacker within the rules' `helpRadius` counts as in reach, and so does a neutral unit
 * (a camp mob) that attacks the mob itself (DEC-166). It fights the target with no time limit
 * while the target is inside the leash, switching only to a strictly better-ranked enemy; only
 * such a switch moves the anchor (DEC-160). When the target leaves the leash the mob takes another
 * enemy in reach at once; with none it chases the target for `leashGraceSeconds` (DEC-144 E), even
 * while the target attacks it: back inside, the target is fought on, else the leash breaks: the
 * mob emits one `stop` and rests again (with no target, its movement walks it back to its slot or
 * post), and for `aggroCooldownSeconds` it leaves alone the enemy that escaped (DEC-144 F) unless
 * that enemy attacks the mob or a mate while inside the old anchor's leash (DEC-160). A dead
 * target with no enemy left in reach leaves it resting, with no cooldown. It never takes a
 * candidate outside its leash, and `objective` ignores the leash, since a structure cannot drag a
 * mob away. During a ghosted first wave
 * (`ghostFirstWaveTicks`, 11 §4.3) Legends are never candidates. Controllers supply only what
 * differs (`LeashRules`). Pure, apart from one scratch point.
 */
export class LeashBehaviour {
  private readonly point: MutableVec2 = { x: 0, y: 0 };

  /** @param classOf - Which priority class each entity kind belongs to. */
  public constructor(private readonly classOf: UnitClassifier) {}

  /** Advances the state machine by one decision. */
  public step<Idle extends string, Rule extends AggroRuleDefinition>(
    situation: LeashSituation<Rule>,
    memory: LeashMemory<Idle>,
    rules: LeashRules<Idle, Rule>,
  ): LeashStep<Idle> {
    if (memory.fsm === 'engaging') {
      return this.engage(situation, memory, rules);
    }
    const best = this.acquire(situation, memory, rules, null);
    if (best !== null) {
      return this.attack(situation, memory, best.id);
    }
    return { memory, commands: [] };
  }

  /**
   * A brain's memory as a leashed mob reads it: the state if it is one of `states`, else `idle`,
   * 0 or `null` for anything it does not hold, and `null` for a target or escaped enemy that is no
   * longer alive (AI56-F3), so a brain never keeps a dead or removed entity.
   */
  public static read<Idle extends string>(
    memory: AiMemory,
    states: readonly (Idle | 'engaging')[],
    idle: Idle,
    isAlive: (id: EntityId) => boolean,
  ): LeashMemory<Idle> {
    const number = (key: keyof LeashMemory<Idle>): number => {
      const value = memory[key];
      return typeof value === 'number' ? value : 0;
    };
    const living = (key: 'targetId' | 'escapedId'): EntityId | null => {
      const value = memory[key];
      return typeof value === 'string' && isAlive(value) ? value : null;
    };
    return {
      fsm: states.find((state) => state === memory.fsm) ?? idle,
      targetId: living('targetId'),
      breakAtTick: number('breakAtTick'),
      cooldownUntilTick: number('cooldownUntilTick'),
      escapedId: living('escapedId'),
      leashX: number('leashX'),
      leashY: number('leashY'),
    };
  }

  /** The candidate's place in the priority list; infinite when it matches no entry. */
  public rankOf({ state, team, rule, objective }: LeashSituation, candidate: EntityId): number {
    const { ghostFirstWaveTicks } = rule;
    if (
      ghostFirstWaveTicks > 0 &&
      state.tick < countdownEndTick(state.config) + ghostFirstWaveTicks
    ) {
      const kind = state.entities.get(candidate)?.kind;
      if (kind !== undefined && this.classOf(kind) === 'legend') {
        return Number.POSITIVE_INFINITY;
      }
    }
    const rank = aggroRank(candidate, {
      team,
      priority: rule.priority,
      entities: state.entities,
      classOf: this.classOf,
      objectiveId: objective?.id ?? null,
    });
    return rank < 0 ? Number.POSITIVE_INFINITY : rank;
  }

  /** Engaging: fight on inside the leash; outside it, take another enemy, chase, or break. */
  private engage<Idle extends string, Rule extends AggroRuleDefinition>(
    situation: LeashSituation<Rule>,
    memory: LeashMemory<Idle>,
    rules: LeashRules<Idle, Rule>,
  ): LeashStep<Idle> {
    const { state, id, rule } = situation;
    const { tickRate } = state.config;
    const { targetId, breakAtTick } = memory;
    const isAlive = targetId !== null && state.entities.isAlive(targetId);
    if (isAlive && this.isInside(situation, memory, rules, targetId)) {
      const best = this.acquire(situation, memory, rules, null);
      if (best !== null && best.rank < this.rankOf(situation, targetId)) {
        return this.attack(situation, memory, best.id);
      }
      return { memory: breakAtTick === 0 ? memory : { ...memory, breakAtTick: 0 }, commands: [] };
    }
    const best = this.acquire(situation, memory, rules, targetId);
    if (best !== null) {
      return this.attack(situation, memory, best.id);
    }
    const stop = [{ type: 'stop', actorId: id }] as const;
    if (!isAlive) {
      return {
        memory: { ...memory, fsm: rules.idle, targetId: null, breakAtTick: 0 },
        commands: stop,
      };
    }
    const grace = Math.round(rule.leashGraceSeconds * tickRate);
    const breakAt = breakAtTick === 0 ? state.tick + grace : breakAtTick;
    if (state.tick < breakAt) {
      return { memory: { ...memory, breakAtTick: breakAt }, commands: [] };
    }
    const cooldownUntilTick = state.tick + Math.round(rule.aggroCooldownSeconds * tickRate);
    return {
      memory: {
        ...memory,
        fsm: rules.idle,
        targetId: null,
        breakAtTick: 0,
        cooldownUntilTick,
        escapedId: targetId,
      },
      commands: stop,
    };
  }

  /**
   * Engages `targetId` with the leash anchored here. The target it fights already keeps its
   * anchor and its grace, with no command: only a switch moves the anchor (DEC-160).
   */
  private attack<Idle extends string>(
    { id, position }: LeashSituation,
    memory: LeashMemory<Idle>,
    targetId: EntityId,
  ): LeashStep<Idle> {
    if (memory.fsm === 'engaging' && memory.targetId === targetId) {
      return { memory, commands: [] };
    }
    return {
      memory: {
        ...memory,
        fsm: 'engaging',
        targetId,
        breakAtTick: 0,
        leashX: position.x,
        leashY: position.y,
      },
      commands: [{ type: 'attack-target', actorId: id, targetId }],
    };
  }

  /** Whether the target is the objective, or a unit inside the leash. */
  private isInside<Idle extends string, Rule extends AggroRuleDefinition>(
    situation: LeashSituation<Rule>,
    memory: LeashMemory<Idle>,
    rules: LeashRules<Idle, Rule>,
    targetId: EntityId,
  ): boolean {
    return (
      targetId === situation.objective?.id ||
      (this.locate(situation, targetId) && !rules.isOutsideLeash(situation, memory, this.point))
    );
  }

  /** Puts `entityId`'s position in `point`; false when the index does not hold it. */
  private locate({ state }: LeashSituation, entityId: EntityId): boolean {
    const space = state.space;
    const index = space?.indexOf(entityId);
    if (space === null || index === undefined) {
      return false;
    }
    this.point.x = space.positions[2 * index] ?? 0;
    this.point.y = space.positions[2 * index + 1] ?? 0;
    return true;
  }

  /**
   * The best enemy to take from here: lowest rank, then nearest, then lowest id. It counts within
   * `acquisitionRadius`, or within the rules' `helpRadius` when it attacks a mate, and only inside
   * a leash anchored here; a neutral unit counts only while it attacks this mob (DEC-166).
   * `escapingId`, the target outside the leash, is never taken again: the grace chases it, and only
   * a switch moves the anchor (DEC-160). Unless it attacks this mob or a mate from inside the old
   * anchor's leash (memory's `leashX/Y`, DEC-160), the enemy that escaped is left alone in the
   * cooldown (DEC-144 F).
   */
  private acquire<Idle extends string, Rule extends AggroRuleDefinition>(
    situation: LeashSituation<Rule>,
    memory: LeashMemory<Idle>,
    rules: LeashRules<Idle, Rule>,
    escapingId: EntityId | null,
  ): LeashCandidate | null {
    const { state, id, team, position, rule, perception } = situation;
    const here = { ...memory, leashX: position.x, leashY: position.y };
    const escapedId = state.tick < memory.cooldownUntilTick ? memory.escapedId : null;
    const reach = rule.acquisitionRadius * rule.acquisitionRadius;
    const radius = Math.max(rule.acquisitionRadius, rules.helpRadius(situation));
    let best = rules.extra(situation);
    const candidates = perception.unitsWithin(position, radius, {
      hostileTo: team,
      neutralAttackersOf: id,
      aliveOnly: true,
    });
    for (const candidate of candidates) {
      if (candidate === escapingId || !this.locate(situation, candidate)) {
        continue;
      }
      const dx = this.point.x - position.x;
      const dy = this.point.y - position.y;
      const gap = dx * dx + dy * dy;
      const victim = state.entities.attackTargetOf(candidate);
      const isHelpCall = victim !== null && rules.isMate(situation, victim);
      // DEC-160 (G2): in the cooldown the escaped enemy is taken back only while it attacks the mob
      // or a mate and is still inside the old anchor's leash, so kiting never drags the mob.
      const isLeftAlone =
        candidate === escapedId &&
        ((victim !== id && !isHelpCall) || rules.isOutsideLeash(situation, memory, this.point));
      if (
        (gap > reach && !isHelpCall) ||
        isLeftAlone ||
        rules.isOutsideLeash(situation, here, this.point)
      ) {
        continue;
      }
      const rank = this.rankOf(situation, candidate);
      if (rank === Number.POSITIVE_INFINITY) {
        continue;
      }
      // Candidates come in id order, so a strict comparison keeps the lower id on a tie.
      if (best === null || rank < best.rank || (rank === best.rank && gap < best.gap)) {
        best = { id: candidate, rank, gap };
      }
    }
    return best;
  }
}
