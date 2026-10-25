import type { AiMemory } from '../state/AiState.types';
import type { EntityId } from '../state/EntityStore.types';
import { formationSlot } from '../state/formationSlot';
import type { MutableVec2 } from '../utils/vec2.types';
import { aggroRank } from './aggroRank';
import type { Controller, Decision, DecisionInput } from './Controller.types';
import { FRESH_MINION_MEMORY, MINION_STATES } from './MinionController.constants';
import type {
  MinionControllerContent,
  MinionMemory,
  MinionSituation,
  MinionStep,
} from './MinionController.types';

/**
 * Drives a lane minion (architecture 18 §6.1, 11 §4.3): `marching → engaging → returning →
 * marching`. Marching, it acquires the best-ranked enemy in `acquisitionRadius` (priority, then
 * distance, then id) and emits one `attack-target`; engaging, it switches only to a strictly
 * better-ranked enemy, and ends the chase with one `stop` when the target dies, the mob leaves its
 * leash or the aggro duration runs out; returning, it marches again within `reformDistance` of its
 * formation slot, with a cooldown before it may acquire. The chase itself is `PathingSystem`'s and
 * the hits `CombatSystem`'s. Stateless: everything it remembers is in the brain it returns.
 *
 * @remarks ponytail: no lane objective until structure entities exist (minion plan M2c).
 */
export class MinionController implements Controller {
  public readonly id = 'minion';
  private readonly anchor: MutableVec2 = { x: 0, y: 0 };
  private readonly forward: MutableVec2 = { x: 0, y: 0 };
  private readonly slot: MutableVec2 = { x: 0, y: 0 };

  /** @param content - Aggro profiles, formations and kind classes; the controller holds none. */
  public constructor(private readonly content: MinionControllerContent) {}

  /**
   * Advances the minion's state machine by one decision.
   *
   * @throws Error when the brain names an aggro profile that does not exist (a content error).
   */
  public decide({ state, entityId, brain, perception }: DecisionInput): Decision {
    const rule = this.content.aggro[brain.profileId];
    if (rule === undefined) {
      throw new Error(
        `Minion "${entityId}" names aggro profile "${brain.profileId}", which does not exist.`,
      );
    }
    const memory = MinionController.read(brain.memory);
    const index = state.space?.indexOf(entityId);
    const team = state.entities.teamOf(entityId);
    if (state.space === null || index === undefined || team === undefined) {
      return { commands: [], memory, rngState: brain.rngState };
    }
    const position = {
      x: state.space.positions[2 * index] ?? 0,
      y: state.space.positions[2 * index + 1] ?? 0,
    };
    const situation = { state, id: entityId, team, position, rule, perception };
    const step = this.step(situation, memory);
    return { commands: step.commands, memory: step.memory, rngState: brain.rngState };
  }

  private step(situation: MinionSituation, memory: MinionMemory): MinionStep {
    if (memory.fsm === 'engaging') {
      return this.engage(situation, memory);
    }
    if (memory.fsm === 'returning') {
      return this.isAtSlot(situation)
        ? {
            memory: {
              ...memory,
              fsm: 'marching',
              cooldownUntilTick: situation.state.tick + situation.rule.aggroCooldownTicks,
            },
            commands: [],
          }
        : { memory, commands: [] };
    }
    const best = situation.state.tick < memory.cooldownUntilTick ? null : this.acquire(situation);
    if (best === null) {
      return { memory, commands: [] };
    }
    return {
      memory: {
        ...memory,
        fsm: 'engaging',
        targetId: best.id,
        aggroUntilTick: situation.state.tick + situation.rule.aggroDurationTicks,
        leashX: situation.position.x,
        leashY: situation.position.y,
      },
      commands: [{ type: 'attack-target', actorId: situation.id, targetId: best.id }],
    };
  }

  /** Engaging: keep the target, switch to a strictly better one, or give up and return. */
  private engage(situation: MinionSituation, memory: MinionMemory): MinionStep {
    const { state, id, position, rule } = situation;
    const targetId = memory.targetId;
    const dx = position.x - memory.leashX;
    const dy = position.y - memory.leashY;
    const isOver =
      targetId === null ||
      !state.entities.isAlive(targetId) ||
      dx * dx + dy * dy > rule.leashRadius * rule.leashRadius ||
      state.tick >= memory.aggroUntilTick;
    if (isOver) {
      return {
        memory: { ...memory, fsm: 'returning', targetId: null },
        commands: [{ type: 'stop', actorId: id }],
      };
    }
    const current = this.rankOf(situation, targetId);
    const best = this.acquire(situation);
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
  private acquire(
    situation: MinionSituation,
  ): { readonly id: EntityId; readonly rank: number } | null {
    const { state, team, position, rule, perception } = situation;
    const space = state.space;
    let best: { id: EntityId; rank: number; gap: number } | null = null;
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

  /** The candidate's place in the priority list; infinite when it matches no entry. */
  private rankOf({ state, team, rule }: MinionSituation, candidate: EntityId): number {
    const rank = aggroRank(candidate, team, rule.priority, state.entities, this.content.classOf);
    return rank < 0 ? Number.POSITIVE_INFINITY : rank;
  }

  /** Within `reformDistance` of its formation slot, or in no horde (nothing to re-form with). */
  private isAtSlot({ state, id, position, rule }: MinionSituation): boolean {
    const horde = state.hordes.hordeOf(id);
    const formation = horde === undefined ? undefined : this.content.formations[horde.formationId];
    if (horde === undefined || formation === undefined || state.routes === null) {
      return true;
    }
    state.routes.pose(horde.lane, horde.team, horde.progress, this.anchor, this.forward);
    const followers = horde.memberIds.filter((member) => member !== horde.leaderId);
    const follower = id === horde.leaderId ? -1 : followers.indexOf(id);
    formationSlot(this.anchor, this.forward, follower, formation, this.slot);
    const dx = this.slot.x - position.x;
    const dy = this.slot.y - position.y;
    return dx * dx + dy * dy <= rule.reformDistance * rule.reformDistance;
  }

  /** The minion's memory from its brain, or the fresh memory for anything it does not hold. */
  private static read(memory: AiMemory): MinionMemory {
    const number = (key: keyof MinionMemory): number => {
      const value = memory[key];
      return typeof value === 'number' ? value : 0;
    };
    const fsm = MINION_STATES.find((state) => state === memory.fsm) ?? FRESH_MINION_MEMORY.fsm;
    return {
      fsm,
      targetId: typeof memory.targetId === 'string' ? memory.targetId : null,
      aggroUntilTick: number('aggroUntilTick'),
      cooldownUntilTick: number('cooldownUntilTick'),
      leashX: number('leashX'),
      leashY: number('leashY'),
    };
  }
}
