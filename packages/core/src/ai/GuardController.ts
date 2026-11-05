import type { GuardAggroRuleDefinition } from '../content/ai/ai.types';
import type { GuardSlot } from '../state/GuardStore.types';
import { distance } from '../utils/geometry';
import type { Controller, Decision, DecisionInput } from './Controller.types';
import { decideLeashed } from './decideLeashed';
import { GUARD_STATES } from './GuardController.constants';
import { LeashBehaviour } from './LeashBehaviour';
import type {
  LeashControllerContent,
  LeashDecisionParts,
  LeashRules,
} from './LeashBehaviour.types';

/**
 * Drives a leashed mob on a guard post (architecture 18 §7, §7.1, 11 §4.4): a tower guard or a
 * forest-camp mob, `holding ⇄ engaging`, through the `LeashBehaviour` and the `decideLeashed` step
 * it shares with `MinionController`. The differences are data from its post in `state.guards`:
 * its leash is the circle the guard plan's `leashRadius` draws around its home's edge (a structure
 * or a camp), and it rests at its post. It never takes or keeps a target outside that circle
 * (MS-36, DEC-144): when the target leaves, the guard walks back to its post, so an enemy that
 * follows is fought nearer the home. It has no grace and no rest, and the guards of one home
 * defend each other anywhere in its circle (DEC-144). Spawning and respawning are `SpawnSystem`'s
 * (the guard plan), never this controller's. Stateless.
 */
export class GuardController implements Controller {
  public readonly id = 'guard';
  private readonly behaviour: LeashBehaviour;
  /** What `decideLeashed` reads from this controller, built once (DEC-168 B1, critic A BTD 4). */
  private readonly parts: LeashDecisionParts<'holding', GuardAggroRuleDefinition> = {
    controllerId: this.id,
    profileOf: (profileId) => this.profileOf(profileId),
    states: GUARD_STATES,
    idle: 'holding',
    situate: (state, entityId) => {
      const post = state.guards.slotOf(entityId);
      return post ? { rules: GuardController.rulesFor(post), objective: null } : null;
    },
  };

  /** @param content - Aggro profiles and kind classes; the controller holds none. */
  public constructor(private readonly content: LeashControllerContent) {
    this.behaviour = new LeashBehaviour(content.classOf);
  }

  /** Whether `profileId` names one of the injected guard aggro profiles (not a minion's). */
  public hasProfile(profileId: string): boolean {
    return this.profileOf(profileId) !== undefined;
  }

  /**
   * Advances the guard's state machine by one decision.
   *
   * @throws Error when the brain names no guard aggro profile (a content error).
   */
  public decide(input: DecisionInput): Decision {
    return decideLeashed(input, this.behaviour, this.parts);
  }

  /** The guard aggro profile `profileId` names, or `undefined` (AI56-F9). */
  private profileOf(profileId: string): GuardAggroRuleDefinition | undefined {
    const rule = this.content.aggro[profileId];
    return rule?.controller === 'guard' ? rule : undefined;
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
