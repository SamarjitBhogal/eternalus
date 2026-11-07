import { Transform } from '../components/Transform';
import type { MinionStrengthCurve } from '../content/mobs/mobs.types';
import type { EntityId } from '../state/EntityStore.types';
import type { GameState } from '../state/GameState';
import type { DamageHit, DamageStep } from './DamageStep.types';
import type { LaneProgressOf } from './MinionStrengthStep.types';

/**
 * Lane minions are stronger near home (architecture 05 §9, 18 MS-16, DISC-24): a horde member's
 * hits are multiplied, and hits on it divided, by `m(t) = clamp(1 + k · (1 − t / c), min, max)`,
 * where `t` is its progress down its lane from its own end (0) to the enemy's (1) and `c` its
 * base-stat point. `c` starts at mid-lane and moves toward the enemy by `shiftPerTowerLost` for
 * each lane tower the enemy has lost on that lane (DISC-24), up to `maxBasePoint`. Health never
 * rescales, so a health bar never jumps. Anything outside a horde (Legends included) is 1.
 *
 * `t` is measured by path cost on the lane's flow field (`balancing.md`), gate to gate, through
 * the injected `LaneProgressOf`; where the field cannot say (no field, or a unit off its corridor),
 * `t` falls back to the nearest point of the lane polyline.
 */
export class MinionStrengthStep implements DamageStep {
  public readonly name = 'minion-strength';

  /**
   * @param curve - The curve's slope, clamps and base-stat point, from content.
   * @param progressOf - Lane progress by flow-field path cost; `null` measures along the polyline.
   * @throws Error when the base-stat point is not inside the lane (`0 < basePoint ≤ maxBasePoint ≤ 1`).
   */
  public constructor(
    private readonly curve: MinionStrengthCurve,
    private readonly progressOf: LaneProgressOf | null = null,
  ) {
    if (!(
      curve.basePoint > 0 &&
      curve.basePoint <= curve.maxBasePoint &&
      curve.maxBasePoint <= 1
    )) {
      throw new Error('MinionStrengthCurve needs 0 < basePoint ≤ maxBasePoint ≤ 1.');
    }
  }

  /** Returns the amount after the attacker's and the target's strength. */
  public adjust({ targetId, amount, source }: DamageHit, state: GameState): number {
    const dealt = source.attackerId === null ? 1 : this.strengthOf(source.attackerId, state);
    return (amount * dealt) / this.strengthOf(targetId, state);
  }

  private strengthOf(id: EntityId, state: GameState): number {
    const horde = state.hordes.hordeOf(id);
    const position = state.entities.get(id)?.findComponent(Transform)?.position;
    const routes = state.world?.routes;
    if (horde === undefined || position === undefined || routes === undefined) {
      return 1;
    }
    const length = routes.length(horde.lane);
    const t =
      this.progressOf?.(horde.lane, horde.team, position) ??
      (length > 0 ? routes.distanceAlong(horde.lane, horde.team, position) / length : 0);
    const { k, min, max, basePoint, shiftPerTowerLost, maxBasePoint } = this.curve;
    const enemy = horde.team === 'light' ? 'dark' : 'light';
    const lost = state.teams[enemy].towersLostByLane[horde.lane] ?? 0;
    const c = Math.min(maxBasePoint, basePoint + shiftPerTowerLost * lost);
    return Math.min(max, Math.max(min, 1 + k * (1 - t / c)));
  }
}
