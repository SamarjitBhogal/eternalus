import type { GuardSlot } from '../state/GuardStore.types';
import { sqrt } from '../utils/deterministicMath';
import type { Controller, Decision, DecisionInput } from './Controller.types';
import { GUARD_STATES } from './GuardController.constants';
import { LeashBehaviour } from './LeashBehaviour';
import type { LeashRules } from './LeashBehaviour.types';
import type { MinionControllerContent } from './MinionController.types';

/**
 * Drives a tower guard (architecture 18 §7, 11 §4.4): `holding → engaging → returning → holding`,
 * through the `LeashBehaviour` it shares with `MinionController`. The differences are data from
 * its post in `state.guards`: the leash is measured from its structure's edge with the guard
 * plan's `leashRadius`, and it rests at its post. Spawning and respawning are `SpawnSystem`'s
 * (the guard plan), never this controller's. Stateless.
 */
export class GuardController implements Controller {
  public readonly id = 'guard';
  private readonly behaviour: LeashBehaviour;

  /** @param content - Aggro profiles and kind classes; the controller holds none. */
  public constructor(private readonly content: Pick<MinionControllerContent, 'aggro' | 'classOf'>) {
    this.behaviour = new LeashBehaviour(content.classOf);
  }

  /** Whether `profileId` names one of the injected aggro rules. */
  public hasProfile(profileId: string): boolean {
    return this.content.aggro[profileId] !== undefined;
  }

  /**
   * Advances the guard's state machine by one decision.
   *
   * @throws Error when the brain names an aggro profile that does not exist (a content error).
   */
  public decide({ state, entityId, brain, perception }: DecisionInput): Decision {
    const rule = this.content.aggro[brain.profileId];
    if (rule === undefined) {
      throw new Error(
        `Guard "${entityId}" names aggro profile "${brain.profileId}", which does not exist.`,
      );
    }
    const memory = LeashBehaviour.read(brain.memory, GUARD_STATES, 'holding');
    const index = state.space?.indexOf(entityId);
    const team = state.entities.teamOf(entityId);
    const post = state.guards.slotOf(entityId);
    if (state.space === null || index === undefined || team === undefined || !post) {
      return { commands: [], memory, rngState: brain.rngState };
    }
    const position = {
      x: state.space.positions[2 * index] ?? 0,
      y: state.space.positions[2 * index + 1] ?? 0,
    };
    const situation = { state, id: entityId, team, position, rule, perception, objective: null };
    const step = this.behaviour.step(situation, memory, GuardController.rulesFor(post));
    return { commands: step.commands, memory: step.memory, rngState: brain.rngState };
  }

  /** The leash and the resting place of the guard on `post`. */
  private static rulesFor(post: GuardSlot): LeashRules<'holding'> {
    return {
      idle: 'holding',
      isOutsideLeash: ({ position }) => {
        const dx = position.x - post.homeX;
        const dy = position.y - post.homeY;
        return sqrt(dx * dx + dy * dy) - post.homeRadius > post.leashRadius;
      },
      isHome: ({ position, rule }) => {
        const dx = position.x - post.postX;
        const dy = position.y - post.postY;
        return dx * dx + dy * dy <= rule.reformDistance * rule.reformDistance;
      },
      extra: () => null,
    };
  }
}
