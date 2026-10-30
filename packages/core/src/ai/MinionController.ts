import type { AiMemory } from '../state/AiState.types';
import { followerIndex, formationSlot } from '../state/formationSlot';
import type { MutableVec2 } from '../utils/vec2.types';
import { sqrt } from '../utils/deterministicMath';
import { LeashBehaviour } from './LeashBehaviour';
import type { LeashCandidate, LeashRules } from './LeashBehaviour.types';
import type { Controller, Decision, DecisionInput } from './Controller.types';
import { MINION_STATES } from './MinionController.constants';
import type {
  MinionControllerContent,
  MinionMemory,
  MinionSituation,
} from './MinionController.types';

/**
 * Drives a lane minion (architecture 18 §6.1, 11 §4.3): `marching → engaging → returning →
 * marching`, through the `LeashBehaviour` it shares with `GuardController`. Marching, it
 * acquires the best-ranked enemy in `acquisitionRadius` (priority, then distance, then id) and emits one `attack-target`; engaging, it switches only to a strictly
 * better-ranked enemy, and ends the chase with one `stop` when the target dies, the mob leaves its
 * leash or the aggro duration runs out; returning, it marches again within `reformDistance` of its
 * formation slot, with a cooldown before it may acquire. The chase itself is `PathingSystem`'s and
 * the hits `CombatSystem`'s. Stateless: everything it remembers is in the brain it returns.
 *
 * The horde's next objective (18 §6.2) is a candidate too, ranked `lane-objective`, once it is
 * breakable and either its edge is within `acquisitionRadius` or the horde has gathered at it (its
 * anchor within `acquisitionRadius` of the objective's front), so the rear ranks and a Stronghold
 * standing off the lane are reached too. A gate that is not breakable yet is never one, so the
 * horde holds in front of it and fights what comes. Attacking the objective ignores the leash and
 * the aggro timeout: a structure cannot drag a mob away.
 */
export class MinionController implements Controller {
  public readonly id = 'minion';
  private readonly anchor: MutableVec2 = { x: 0, y: 0 };
  private readonly forward: MutableVec2 = { x: 0, y: 0 };
  private readonly slot: MutableVec2 = { x: 0, y: 0 };

  private readonly behaviour: LeashBehaviour;
  private readonly rules: LeashRules<'marching'> = {
    idle: 'marching',
    isOutsideLeash: ({ position, rule }, memory) => {
      const dx = position.x - memory.leashX;
      const dy = position.y - memory.leashY;
      return dx * dx + dy * dy > rule.leashRadius * rule.leashRadius;
    },
    isHome: (situation) => this.isAtSlot(situation),
    extra: (situation) => this.objectiveCandidate(situation),
  };

  /** @param content - Aggro profiles, formations and kind classes; the controller holds none. */
  public constructor(private readonly content: MinionControllerContent) {
    this.behaviour = new LeashBehaviour(content.classOf);
  }

  /** Whether `profileId` names one of the injected aggro rules. */
  public hasProfile(profileId: string): boolean {
    return this.content.aggro[profileId] !== undefined;
  }

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
    const horde = state.hordes.hordeOf(entityId);
    const standing =
      horde === undefined
        ? null
        : state.laneStructures.objectiveFor(horde.lane, horde.team, state.entities);
    const objective = standing?.isBreakable === true ? standing : null;
    const situation = { state, id: entityId, team, position, rule, perception, objective };
    const step = this.behaviour.step(situation, memory, this.rules);
    return { commands: step.commands, memory: step.memory, rngState: brain.rngState };
  }

  /** The lane objective as a candidate, once in reach or once the horde has gathered at it. */
  private objectiveCandidate(situation: MinionSituation): LeashCandidate | null {
    const { state, position, rule, objective } = situation;
    if (objective === null) {
      return null;
    }
    const ox = objective.x - position.x;
    const oy = objective.y - position.y;
    const edge = sqrt(ox * ox + oy * oy) - objective.radius;
    const rank = this.behaviour.rankOf(situation, objective.id);
    const progress = state.hordes.hordeOf(situation.id)?.progress ?? Number.NEGATIVE_INFINITY;
    const isGathered = progress + rule.acquisitionRadius >= objective.frontProgress;
    return (edge <= rule.acquisitionRadius || isGathered) && rank !== Number.POSITIVE_INFINITY
      ? { id: objective.id, rank, gap: Math.max(0, edge) ** 2 }
      : null;
  }

  /** Within `reformDistance` of its formation slot, or in no horde (nothing to re-form with). */
  private isAtSlot({ state, id, position, rule }: MinionSituation): boolean {
    const horde = state.hordes.hordeOf(id);
    const formation = horde === undefined ? undefined : this.content.formations[horde.formationId];
    if (horde === undefined || formation === undefined || state.routes === null) {
      return true;
    }
    state.routes.pose(horde.lane, horde.team, horde.progress, this.anchor, this.forward);
    const follower = followerIndex(horde.memberIds, horde.leaderId, id);
    formationSlot(this.anchor, this.forward, follower, formation, this.slot);
    const dx = this.slot.x - position.x;
    const dy = this.slot.y - position.y;
    return dx * dx + dy * dy <= rule.reformDistance * rule.reformDistance;
  }

  /** The minion's memory from its brain, or the fresh memory for anything it does not hold. */
  private static read(memory: AiMemory): MinionMemory {
    return LeashBehaviour.read(memory, MINION_STATES, 'marching');
  }
}
