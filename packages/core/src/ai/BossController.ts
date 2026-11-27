import type { BossProfileDefinition } from '../content/ai/ai.types';
import type { AiMemory } from '../state/AiState.types';
import type { EntityId } from '../state/EntityStore.types';
import type { GameState } from '../state/GameState';
import { sqrt } from '../utils/deterministicMath';
import type { Vec2 } from '../utils/geometry.types';
import { SeededRandom } from '../utils/SeededRandom';
import { TickRate } from '../utils/TickRate';
import type { BossState, BossStep, BossTurn, BossZone } from './BossController.types';
import { BossMoveChooser } from './BossMoveChooser';
import type { BossTarget } from './BossMoveChooser.types';
import type { Controller, Decision, DecisionInput } from './Controller.types';

/**
 * Drives a boss (architecture 11 §4.6): the entrance (the GreaterBoss's roar), then `roam →
 * telegraph → execute → recover → roam`, one state per decision, so the order never skips one.
 * In `roam` its situation tree (`BossMoveChooser`, DEC-371 E7) picks a move and a target: when it
 * finds one, the boss sends `boss-move` aimed at that target: the move stops it, telegraphs on the
 * next tick and lands `telegraphSeconds` later (`BossMoveSystem`); it stands through `telegraph`,
 * `execute` and `recover`. Else `roam` never stands still: it walks toward the nearest non-neutral
 * unit inside the zone (clamped to the zone), or else to a seeded random point inside the zone, a
 * new one on arrival or every `roamSeconds`. The zone is its guard post's circle (home edge plus
 * leash). Stateless: its FSM, timers, cooldowns and roam point live in the brain's memory.
 */
export class BossController implements Controller {
  public readonly id = 'boss';

  private readonly choosers: ReadonlyMap<string, BossMoveChooser>;

  /**
   * @param profiles - Every boss profile by id (`content/ai/bosses/`).
   * @throws Error when a profile's brain names a move it does not have (`BossMoveChooser`).
   */
  public constructor(private readonly profiles: Readonly<Record<string, BossProfileDefinition>>) {
    this.choosers = new Map(
      Object.values(profiles).map((profile) => [profile.id, new BossMoveChooser(profile)]),
    );
  }

  /** Whether `profileId` names a boss profile. */
  public hasProfile(profileId: string): boolean {
    return this.profiles[profileId] !== undefined;
  }

  /**
   * Advances the boss's state machine by one step. A boss off a post or out of the index decides
   * nothing.
   *
   * @throws Error when the brain names no boss profile (a content error).
   */
  public decide({ state, entityId, brain, perception }: DecisionInput): Decision {
    const profile = this.profiles[brain.profileId];
    const chooser = this.choosers.get(brain.profileId);
    if (profile === undefined || chooser === undefined) {
      throw new Error(`Entity "${entityId}" names boss profile "${brain.profileId}", unknown.`);
    }
    const zone = BossController.zoneOf(state, entityId);
    const index = state.space?.indexOf(entityId);
    if (zone === null || state.space === null || index === undefined) {
      return { commands: [], memory: brain.memory, rngState: brain.rngState };
    }
    const { positions } = state.space;
    const rng = SeededRandom.fromState(brain.rngState);
    const rate = new TickRate(state.config.tickRate);
    const { commands, memory } = BossController.step(chooser, {
      state,
      id: entityId,
      memory: brain.memory,
      profile,
      zone,
      at: { x: positions[2 * index] ?? 0, y: positions[2 * index + 1] ?? 0 },
      perception,
      rng,
      ticks: (seconds) => rate.toTicks(seconds),
    });
    return { commands, memory, rngState: rng.getState() };
  }

  /** One FSM step: a timed state holds until its tick, then gives way to the next. */
  private static step(chooser: BossMoveChooser, turn: BossTurn): BossStep {
    const { state, memory, profile, ticks } = turn;
    const fsm = memory.fsm;
    const until = Number(memory.until ?? 0);
    if (fsm === undefined) {
      return {
        commands: [],
        memory: { fsm: 'entrance', until: state.tick + ticks(profile.entranceSeconds) },
      };
    }
    const isTimed = fsm === 'entrance' || fsm === 'telegraph' || fsm === 'recover';
    if (isTimed && state.tick < until) {
      return { commands: [], memory };
    }
    if (fsm === 'telegraph') {
      return { commands: [], memory: { ...memory, fsm: 'execute' satisfies BossState } };
    }
    if (fsm === 'execute') {
      const move = profile.moves.find(({ id }) => id === memory.moveId);
      const recoverUntil = until + ticks(move?.recoverSeconds ?? 0);
      return {
        commands: [],
        memory: { ...memory, fsm: 'recover' satisfies BossState, until: recoverUntil },
      };
    }
    return BossController.roam(chooser, turn);
  }

  /**
   * `roam`: start the move the situation tree picks, else walk on (toward the nearest target or a
   * roam point). A boss just out of `entrance` or `recover` roams for one decision before it may
   * start a move.
   */
  private static roam(chooser: BossMoveChooser, turn: BossTurn): BossStep {
    const { state, id, memory, profile, at, ticks } = turn;
    const targets = BossController.targetsOf(turn);
    const choice = memory.fsm === 'roam' ? chooser.choose(turn, targets) : null;
    if (choice !== null) {
      const { move, target, landTick } = choice;
      return {
        commands: [{ type: 'boss-move', actorId: id, moveId: move.id, targetId: target.id }],
        memory: {
          ...memory,
          fsm: 'telegraph' satisfies BossState,
          moveId: move.id,
          until: landTick,
          [`ready:${move.id}`]: landTick + ticks(move.cooldownSeconds),
        },
      };
    }
    let next: AiMemory = { ...memory, fsm: 'roam' satisfies BossState };
    const [nearest] = targets;
    let to = nearest === undefined ? null : BossController.clampToZone(nearest.at, turn);
    if (to === null) {
      const point = { x: Number(memory.roamX), y: Number(memory.roamY) };
      const isDue =
        memory.roamX === undefined ||
        state.tick >= Number(memory.roamUntil) ||
        BossController.gap(point, at) <= profile.roamArrivalRadius;
      to = isDue ? BossController.roamPoint(turn) : point;
      if (isDue) {
        const roamUntil = state.tick + ticks(profile.roamSeconds);
        next = { ...next, roamX: to.x, roamY: to.y, roamUntil };
      }
    }
    const length = BossController.gap(to, at);
    const direction =
      length === 0 ? { x: 0, y: 0 } : { x: (to.x - at.x) / length, y: (to.y - at.y) / length };
    return { commands: [{ type: 'move', actorId: id, direction }], memory: next };
  }

  /** The living non-neutral units inside the zone, nearest first; ties go to the lower id. */
  private static targetsOf({ state, zone, at, perception }: BossTurn): BossTarget[] {
    const { space } = state;
    const targets: BossTarget[] = [];
    for (const id of perception.unitsWithin(zone, zone.radius, {
      hostileTo: 'neutral',
      aliveOnly: true,
    })) {
      const index = space?.indexOf(id);
      if (space === null || index === undefined) continue;
      const point = { x: space.positions[2 * index] ?? 0, y: space.positions[2 * index + 1] ?? 0 };
      targets.push({ id, at: point, gap: BossController.gap(point, at) });
    }
    // A stable sort keeps `unitsWithin`'s id order between equal gaps.
    return targets.sort((a, b) => a.gap - b.gap);
  }

  /** A seeded random point inside the zone, `zoneMargin` from its edge (rejection sampling). */
  private static roamPoint({ zone, profile, rng }: BossTurn): Vec2 {
    const reach = Math.max(0, zone.radius - profile.zoneMargin);
    for (;;) {
      const x = (2 * rng.nextFloat() - 1) * reach;
      const y = (2 * rng.nextFloat() - 1) * reach;
      if (x * x + y * y <= reach * reach) {
        return { x: zone.x + x, y: zone.y + y };
      }
    }
  }

  /** `point`, pulled in to at most `zoneMargin` inside the zone's edge. */
  private static clampToZone(point: Vec2, { zone, profile }: BossTurn): Vec2 {
    const reach = Math.max(0, zone.radius - profile.zoneMargin);
    const out = BossController.gap(point, zone);
    return out <= reach
      ? point
      : {
          x: zone.x + ((point.x - zone.x) * reach) / out,
          y: zone.y + ((point.y - zone.y) * reach) / out,
        };
  }

  /** The boss's zone: its guard post's home circle plus the leash; `null` off a post. */
  private static zoneOf(state: GameState, id: EntityId): BossZone | null {
    const post = state.guards.slotOf(id);
    return post === undefined
      ? null
      : { x: post.homeX, y: post.homeY, radius: post.homeRadius + post.leashRadius };
  }

  /** The distance between two points. */
  private static gap(from: Vec2, to: Vec2): number {
    return sqrt((from.x - to.x) ** 2 + (from.y - to.y) ** 2);
  }
}
