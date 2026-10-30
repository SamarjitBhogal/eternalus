import type { AiMemory } from '../state/AiState.types';
import type { EntityId } from '../state/EntityStore.types';
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
 * The acquire, engage and return logic every leashed mob shares (architecture 18 §6.1, §7): from
 * rest it acquires the best-ranked enemy (priority, then distance, then id) and emits one
 * `attack-target`; engaging, it switches only to a strictly better-ranked enemy and ends with one
 * `stop` when the target dies, the mob leaves its leash or the aggro duration runs out; returning,
 * it rests again once home, with a cooldown before it may acquire. During a ghosted first wave
 * (`ghostFirstWaveTicks`, 11 §4.3) Legends are never candidates. Attacking `objective` ignores
 * the leash and the timeout, since a structure cannot drag a mob away. Controllers supply only
 * what differs (`LeashRules`). Pure.
 */
export class LeashBehaviour {
  /** @param classOf - Which priority class each entity kind belongs to. */
  public constructor(private readonly classOf: UnitClassifier) {}

  /** Advances the state machine by one decision. */
  public step<Idle extends string>(
    situation: LeashSituation,
    memory: LeashMemory<Idle>,
    rules: LeashRules<Idle>,
  ): LeashStep<Idle> {
    const { state, id, rule } = situation;
    if (memory.fsm === 'engaging') {
      return this.engage(situation, memory, rules);
    }
    if (memory.fsm === 'returning') {
      return rules.isHome(situation)
        ? {
            memory: {
              ...memory,
              fsm: rules.idle,
              cooldownUntilTick: state.tick + rule.aggroCooldownTicks,
            },
            commands: [],
          }
        : { memory, commands: [] };
    }
    const best = state.tick < memory.cooldownUntilTick ? null : this.acquire(situation, rules);
    if (best === null) {
      return { memory, commands: [] };
    }
    return {
      memory: {
        ...memory,
        fsm: 'engaging',
        targetId: best.id,
        aggroUntilTick: state.tick + rule.aggroDurationTicks,
        leashX: situation.position.x,
        leashY: situation.position.y,
      },
      commands: [{ type: 'attack-target', actorId: id, targetId: best.id }],
    };
  }

  /**
   * A brain's memory as a leashed mob reads it: the state if it is one of `states`, else `idle`,
   * and 0 or `null` for anything it does not hold.
   */
  public static read<Idle extends string>(
    memory: AiMemory,
    states: readonly (Idle | 'engaging' | 'returning')[],
    idle: Idle,
  ): LeashMemory<Idle> {
    const number = (key: keyof LeashMemory<Idle>): number => {
      const value = memory[key];
      return typeof value === 'number' ? value : 0;
    };
    return {
      fsm: states.find((state) => state === memory.fsm) ?? idle,
      targetId: typeof memory.targetId === 'string' ? memory.targetId : null,
      aggroUntilTick: number('aggroUntilTick'),
      cooldownUntilTick: number('cooldownUntilTick'),
      leashX: number('leashX'),
      leashY: number('leashY'),
    };
  }

  /** The candidate's place in the priority list; infinite when it matches no entry. */
  public rankOf({ state, team, rule, objective }: LeashSituation, candidate: EntityId): number {
    const { countdownSeconds } = state.config.match;
    const ghostUntil = countdownSeconds * state.config.tickRate + rule.ghostFirstWaveTicks;
    const kind = state.entities.get(candidate)?.kind;
    if (
      rule.ghostFirstWaveTicks > 0 &&
      state.tick < ghostUntil &&
      kind !== undefined &&
      this.classOf(kind) === 'legend'
    ) {
      return Number.POSITIVE_INFINITY;
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

  /** Engaging: keep the target, switch to a strictly better one, or give up and return. */
  private engage<Idle extends string>(
    situation: LeashSituation,
    memory: LeashMemory<Idle>,
    rules: LeashRules<Idle>,
  ): LeashStep<Idle> {
    const { state, id, rule } = situation;
    const targetId = memory.targetId;
    const isObjective = targetId !== null && targetId === situation.objective?.id;
    const isOver =
      targetId === null ||
      !state.entities.isAlive(targetId) ||
      (!isObjective &&
        (rules.isOutsideLeash(situation, memory) || state.tick >= memory.aggroUntilTick));
    if (isOver) {
      return {
        memory: { ...memory, fsm: 'returning', targetId: null },
        commands: [{ type: 'stop', actorId: id }],
      };
    }
    const current = this.rankOf(situation, targetId);
    const best = this.acquire(situation, rules);
    if (best === null || best.rank >= current) {
      return { memory, commands: [] };
    }
    return {
      memory: {
        ...memory,
        targetId: best.id,
        aggroUntilTick: state.tick + rule.aggroDurationTicks,
      },
      commands: [{ type: 'attack-target', actorId: id, targetId: best.id }],
    };
  }

  /** The best enemy in reach of acquisition: lowest rank, then nearest, then lowest id. */
  private acquire<Idle extends string>(
    situation: LeashSituation,
    rules: LeashRules<Idle>,
  ): LeashCandidate | null {
    const { state, team, position, rule, perception } = situation;
    const space = state.space;
    let best = rules.extra(situation);
    const candidates = perception.unitsWithin(position, rule.acquisitionRadius, {
      hostileTo: team,
      aliveOnly: true,
    });
    for (const candidate of candidates) {
      const rank = this.rankOf(situation, candidate);
      const index = space?.indexOf(candidate);
      if (rank === Number.POSITIVE_INFINITY || space === null || index === undefined) {
        continue;
      }
      const dx = (space.positions[2 * index] ?? 0) - position.x;
      const dy = (space.positions[2 * index + 1] ?? 0) - position.y;
      const gap = dx * dx + dy * dy;
      // Candidates come in id order, so a strict comparison keeps the lower id on a tie.
      if (best === null || rank < best.rank || (rank === best.rank && gap < best.gap)) {
        best = { id: candidate, rank, gap };
      }
    }
    return best;
  }
}
