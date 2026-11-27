import type {
  BossBranchDefinition,
  BossConsideration,
  BossMoveDefinition,
  BossProfileDefinition,
} from '../content/ai/ai.types';
import { Action } from './bt/Action';
import { ActiveSelector } from './bt/ActiveSelector';
import type { BtNode, BtStatus } from './bt/BtNode.types';
import { Condition } from './bt/Condition';
import { Sequence } from './bt/Sequence';
import type { BossTurn } from './BossController.types';
import type { BossChoice, BossSight, BossTarget } from './BossMoveChooser.types';
import { closeness, share } from './utility/considerations';
import { UtilityScorer } from './utility/UtilityScorer';

/**
 * A boss's situation tree (architecture 11 §4.6, DEC-371 E7), built once per profile: an
 * `ActiveSelector` of four branches, highest priority first, as Alien: Isolation's top-level
 * selector picks a kind of behaviour from its senses. Each branch is a condition that finds its
 * target, then an action that picks one of the branch's moves.
 *
 * 1. `punish`: the top recent damage dealer is a Legend in the zone, within `meleeRange`, with at
 *    least `punishShare` of the recent damage: hit it hard.
 * 2. `crowd`: at least `crowdCount` targets within `crowdRadius`: hit them all (aimed at the
 *    nearest).
 * 3. `far`: the nearest target is beyond `meleeRange`: reach it.
 * 4. `fallback`: any target: the nearest.
 *
 * An action keeps the branch's moves that are open (a `hurtPhase` move only once the boss is
 * `hurt`, DEC-417), off cooldown and in range of the target. When none is left the branch fails
 * and the next one is tried. Two or more are scored by the branch's weights (`UtilityScorer`) and
 * one is drawn by a seeded weighted pick from the brain's stream, so players cannot learn a fixed
 * order and a replay draws the same.
 */
export class BossMoveChooser {
  private readonly tree: BtNode<BossSight>;
  private readonly moves: ReadonlyMap<string, BossMoveDefinition>;
  private readonly hurtMoveIds: ReadonlySet<string>;
  private readonly maxDamage: number;

  /**
   * @param profile - The boss profile whose brain and moves the tree uses.
   * @throws Error when a branch or the hurt phase names a move the profile does not have (a
   *   content error, caught before play).
   */
  public constructor(private readonly profile: BossProfileDefinition) {
    this.moves = new Map(profile.moves.map((move) => [move.id, move]));
    const { brain, hurtPhase } = profile;
    const named = [brain.punish, brain.crowd, brain.far, brain.fallback, hurtPhase].flatMap(
      ({ moveIds }) => moveIds,
    );
    const unknown = named.find((id) => !this.moves.has(id));
    if (unknown !== undefined) {
      throw new Error(
        `Boss profile "${profile.id}" names move "${unknown}", which it does not have.`,
      );
    }
    this.hurtMoveIds = new Set(hurtPhase.moveIds);
    this.maxDamage = Math.max(0, ...profile.moves.map((move) => BossMoveChooser.damageOf(move)));
    this.tree = new ActiveSelector([
      this.branch((sight) => this.punishTarget(sight), brain.punish),
      this.branch((sight) => this.crowdTarget(sight), brain.crowd),
      this.branch(({ targets: [nearest] }) => {
        return nearest !== undefined && nearest.gap > brain.meleeRange ? nearest : null;
      }, brain.far),
      this.branch(({ targets: [nearest] }) => nearest ?? null, brain.fallback),
    ]);
  }

  /**
   * The move the boss starts now and its target, or `null` when no branch has a ready move in
   * range (the boss then chases or roams).
   *
   * @param targets - Every living non-neutral unit in the zone, nearest first; ties go to the
   *   lower id.
   */
  public choose(turn: BossTurn, targets: readonly BossTarget[]): BossChoice | null {
    const sight: BossSight = { turn, targets, target: null, choice: null };
    this.tree.tick(sight);
    return sight.choice;
  }

  /** One branch: `find` names its target (or `null`), then a move of `branch` is picked for it. */
  private branch(
    find: (sight: BossSight) => BossTarget | null,
    branch: BossBranchDefinition,
  ): BtNode<BossSight> {
    const scorer = new UtilityScorer<BossConsideration>(branch.weights);
    return new Sequence<BossSight>([
      new Condition((sight) => {
        sight.target = find(sight);
        return sight.target !== null;
      }),
      new Action((sight) => this.pick(sight, branch, scorer)),
    ]);
  }

  /** The top recent damage dealer, when it is a Legend in the zone and in melee range. */
  private punishTarget({ turn, targets }: BossSight): BossTarget | null {
    const { state, id, ticks } = turn;
    const { threatSeconds, punishShare, meleeRange } = this.profile.brain;
    const totals = state.entities.recentDamageTo(id, state.tick - ticks(threatSeconds));
    let top = totals[0];
    let sum = 0;
    for (const total of totals) {
      sum += total.amount;
      if (top === undefined || total.amount > top.amount) top = total;
    }
    const target = targets.find(({ id: targetId }) => targetId === top?.attackerId);
    return top === undefined ||
      top.amount < punishShare * sum ||
      sum <= 0 ||
      target === undefined ||
      target.gap > meleeRange ||
      state.entities.get(target.id)?.family !== 'legend'
      ? null
      : target;
  }

  /** The nearest target, when at least `crowdCount` targets are within `crowdRadius`. */
  private crowdTarget({ targets }: BossSight): BossTarget | null {
    const { crowdRadius, crowdCount } = this.profile.brain;
    const isCrowded = targets.filter(({ gap }) => gap <= crowdRadius).length >= crowdCount;
    return isCrowded ? (targets[0] ?? null) : null;
  }

  /** Picks one of the branch's ready moves for the target, or fails when there is none. */
  private pick(
    sight: BossSight,
    branch: BossBranchDefinition,
    scorer: UtilityScorer<BossConsideration>,
  ): BtStatus {
    const { turn, targets, target } = sight;
    if (target === null) {
      return 'failure';
    }
    const { state, id, memory, ticks, rng } = turn;
    const isHurt = state.entities.bossPhaseOf(id) === 'hurt';
    const landTickOf = (move: BossMoveDefinition): number =>
      state.tick + 1 + ticks(move.telegraphSeconds);
    const ready = branch.moveIds.filter((moveId) => {
      const move = this.moves.get(moveId);
      const readyTick = memory[`ready:${moveId}`];
      return (
        move !== undefined &&
        (isHurt || !this.hurtMoveIds.has(moveId)) &&
        target.gap <= move.range &&
        (typeof readyTick !== 'number' || landTickOf(move) >= readyTick)
      );
    });
    const moveId = scorer.pick(
      ready,
      (option) => {
        const move = this.moves.get(option);
        const range = move?.range ?? 0;
        return {
          reach: closeness(target.gap, range),
          // ponytail: counts the move's range circle, not its cone or line; test the shape (the
          // `BossMoveEffect`'s) if a sweep keeps winning a crowd behind the boss.
          crowd: share(targets.filter(({ gap }) => gap <= range).length, targets.length),
          damage: share(move === undefined ? 0 : BossMoveChooser.damageOf(move), this.maxDamage),
        };
      },
      rng,
    );
    const move = moveId === null ? undefined : this.moves.get(moveId);
    if (move === undefined) {
      return 'failure';
    }
    sight.choice = { move, target, landTick: landTickOf(move) };
    return 'success';
  }

  /** A move's damage per hit; 0 for one that deals none (the roar). */
  private static damageOf(move: BossMoveDefinition): number {
    return 'damage' in move ? move.damage : 0;
  }
}
