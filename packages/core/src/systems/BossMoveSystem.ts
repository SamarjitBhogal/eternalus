import type { DamagePipeline } from '../combat/DamagePipeline';
import { BossMoveCast } from '../components/BossMoveCast';
import { Transform } from '../components/Transform';
import type { BossMoveDefinition, BossMoveEffectId, BossMoveOf } from '../content/ai/ai.types';
import type { EntityId } from '../state/EntityStore.types';
import type { GameState } from '../state/GameState';
import { compareById } from '../utils/compareById';
import type { Vec2 } from '../utils/geometry.types';
import type { BossMoveEffects, BossMoveLanding } from './BossMoveSystem.types';
import type { System, SystemContext } from './System.types';

/**
 * Lands boss moves (architecture 11 §4.6) on their landing tick: the move's effect strategy (by
 * its `effect` id) hits the living non-neutral units inside its shape through the damage pipeline,
 * in id order, then `boss-move-executed` is emitted. A unit that left the shape during the
 * telegraph is not hit. Interim for doc 05's `AbilitySystem` and its `AbilityEffect` strategies.
 */
export class BossMoveSystem implements System {
  public readonly name = 'boss-move';
  private found = new Int32Array(0);
  private readonly hit: EntityId[] = [];

  /**
   * @param damage - The match's one damage pipeline.
   * @param moves - Every boss move by id (`content/ai/bosses/`).
   * @param effects - The strategy that lands each effect id.
   */
  public constructor(
    private readonly damage: DamagePipeline,
    private readonly moves: Readonly<Record<string, BossMoveDefinition>>,
    private readonly effects: BossMoveEffects,
  ) {}

  /** Lands each move due this tick, boss by boss in store order. */
  public update({ state }: SystemContext): void {
    state.entities.forEach((boss) => {
      const cast = boss.findComponent(BossMoveCast);
      const moveId = cast?.moveId ?? null;
      if (cast === undefined || moveId === null || cast.landTick > state.tick) {
        return;
      }
      cast.clear();
      const move = this.moves[moveId];
      const transform = boss.findComponent(Transform);
      if (move === undefined || transform === undefined || !state.entities.isAlive(boss.id)) {
        return;
      }
      this.land(move, {
        state,
        bossId: boss.id,
        at: transform.position,
        facing: transform.facing,
        unitsWithin: (radius) => this.unitsHit(state, transform.position, radius),
        strike: (targetId, amount) => {
          this.damage.apply(state, targetId, amount, {
            attackerId: boss.id,
            kind: 'ability',
            definitionId: move.id,
          });
        },
      });
      state.events.emit('boss-move-executed', { bossId: boss.id, move: move.id });
    });
  }

  /** Hands `move` to the strategy of its effect id. */
  private land<K extends BossMoveEffectId>(move: BossMoveOf<K>, landing: BossMoveLanding): void {
    this.effects[move.effect].land(move, landing);
  }

  /** The living non-neutral units whose centres are within `radius` of `at`, in id order. */
  private unitsHit(state: GameState, at: Vec2, radius: number): readonly EntityId[] {
    this.hit.length = 0;
    const { space } = state;
    if (space === null) {
      return this.hit;
    }
    if (this.found.length < space.count) {
      this.found = new Int32Array(Math.max(space.count, 2 * this.found.length));
    }
    const count = space.queryCircle(at.x, at.y, radius, this.found);
    for (let index = 0; index < count; index += 1) {
      const id = space.idAt(this.found[index] ?? 0);
      const team = state.entities.teamOf(id);
      if (team !== undefined && team !== 'neutral' && state.entities.isAlive(id)) {
        this.hit.push(id);
      }
    }
    return this.hit.sort(compareById);
  }
}
