import type { HordeAggroRuleDefinition } from '../content/ai/ai.types';
import type { EntityId } from '../state/EntityStore.types';
import type { GameState } from '../state/GameState';
import type { LaneObjective } from '../state/LaneStructures.types';
import { sqrt } from '../utils/deterministicMath';
import type { Controller, Decision, DecisionInput } from './Controller.types';
import { decideLeashed } from './decideLeashed';
import { LeashBehaviour } from './LeashBehaviour';
import type {
  LeashCandidate,
  LeashControllerContent,
  LeashDecisionParts,
  LeashRules,
} from './LeashBehaviour.types';
import { MINION_STATES } from './MinionController.constants';
import type { MinionSituation } from './MinionController.types';

/**
 * Drives a lane minion (architecture 18 §6.1, 11 §4.3): `marching ⇄ engaging`, through the
 * `LeashBehaviour` and the `decideLeashed` step it shares with `GuardController`. Its leash is a
 * circle of `leashRadius` around where it took its target, and it fights a target inside it with
 * no time limit (MS-36, DEC-144); an enemy attacking a horde-mate within `callForHelpRadius` is in
 * reach too. Back at rest, its horde's movement walks it to its formation slot (DEC-155). The
 * chase itself is `PathingSystem`'s and the hits `CombatSystem`'s. Stateless: everything it
 * remembers is in the brain it returns.
 *
 * The horde's next objective (18 §6.2) is a candidate too, ranked `lane-objective`, once it is
 * breakable and either its edge is within `acquisitionRadius` or the horde has gathered at it (its
 * anchor within `acquisitionRadius` of the objective's front), so the rear ranks and a Stronghold
 * standing off the lane are reached too. A gate that is not breakable yet is never one, so the
 * horde holds in front of it and fights what comes. Attacking the objective ignores the leash: a
 * structure cannot drag a mob away.
 */
export class MinionController implements Controller {
  public readonly id = 'minion';

  private readonly behaviour: LeashBehaviour;
  private readonly rules: LeashRules<'marching', HordeAggroRuleDefinition> = {
    idle: 'marching',
    isOutsideLeash: ({ rule }, memory, point) => {
      const dx = point.x - memory.leashX;
      const dy = point.y - memory.leashY;
      return dx * dx + dy * dy > rule.leashRadius * rule.leashRadius;
    },
    extra: (situation) => this.objectiveCandidate(situation),
    isMate: ({ state, id }, victimId) => {
      const hordeId = state.hordes.hordeOf(id)?.id;
      return hordeId !== undefined && state.hordes.hordeOf(victimId)?.id === hordeId;
    },
    helpRadius: ({ rule }) => rule.callForHelpRadius,
  };
  /** What `decideLeashed` reads from this controller, built once (DEC-168 B1, critic A BTD 4). */
  private readonly parts: LeashDecisionParts<'marching', HordeAggroRuleDefinition> = {
    controllerId: this.id,
    profileOf: (profileId) => this.profileOf(profileId),
    states: MINION_STATES,
    idle: 'marching',
    situate: (state, entityId) => ({
      rules: this.rules,
      objective: MinionController.objectiveOf(state, entityId),
    }),
  };

  /** @param content - Aggro profiles and kind classes; the controller holds none. */
  public constructor(private readonly content: LeashControllerContent) {
    this.behaviour = new LeashBehaviour(content.classOf);
  }

  /** Whether `profileId` names one of the injected minion aggro profiles (not a guard's). */
  public hasProfile(profileId: string): boolean {
    return this.profileOf(profileId) !== undefined;
  }

  /**
   * Advances the minion's state machine by one decision.
   *
   * @throws Error when the brain names no minion aggro profile (a content error).
   */
  public decide(input: DecisionInput): Decision {
    return decideLeashed(input, this.behaviour, this.parts);
  }

  /** The minion aggro profile `profileId` names, or `undefined` (AI56-F9). */
  private profileOf(profileId: string): HordeAggroRuleDefinition | undefined {
    const rule = this.content.aggro[profileId];
    return rule?.controller === 'minion' ? rule : undefined;
  }

  /** The horde's next objective once it is breakable; `null` for none. */
  private static objectiveOf(state: GameState, entityId: EntityId): LaneObjective | null {
    const horde = state.hordes.hordeOf(entityId);
    const standing =
      horde === undefined
        ? null
        : state.laneStructures.objectiveFor(horde.lane, horde.team, state.entities);
    return standing?.isBreakable === true ? standing : null;
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
}
