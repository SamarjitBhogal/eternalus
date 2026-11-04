import type { GuardSlot } from '../state/GuardStore.types';
import { distance } from '../utils/geometry';
import type { Controller, Decision, DecisionInput } from './Controller.types';
import { GUARD_STATES } from './GuardController.constants';
import { LeashBehaviour } from './LeashBehaviour';
import type { LeashRules } from './LeashBehaviour.types';
import type { MinionControllerContent } from './MinionController.types';

/**
 * Drives a tower guard (architecture 18 §7, 11 §4.4): `holding ⇄ engaging`,
 * through the `LeashBehaviour` it shares with `MinionController`. The differences are data from
 * its post in `state.guards`: its leash is the circle the guard plan's `leashRadius` draws around
 * its structure's edge, and it rests at its post. It never takes or keeps a target outside that
 * circle (MS-36, DEC-144): when the target leaves, the guard walks back to its post, so an enemy
 * that follows is fought nearer the structure. It has no grace and no rest, and the guards of
 * one structure defend each other anywhere in its circle (DEC-144). Spawning and respawning are
 * `SpawnSystem`'s (the guard plan), never this controller's. Stateless.
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
    const home = { x: post.homeX, y: post.homeY };
    return {
      idle: 'holding',
      isOutsideLeash: (_situation, _memory, point) =>
        distance(point, home) - post.homeRadius > post.leashRadius,
      extra: () => null,
      // Guards of one structure defend each other anywhere in its circle (DEC-144).
      isMate: ({ state }, victimId) => state.guards.slotOf(victimId)?.homeId === post.homeId,
      helpRadius: ({ position }) => distance(position, home) + post.homeRadius + post.leashRadius,
    };
  }
}
