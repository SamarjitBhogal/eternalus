import type { DamagePipeline } from '../combat/DamagePipeline';
import { Health } from '../components/Health';
import { StrikeCooldown } from '../components/StrikeCooldown';
import { Transform } from '../components/Transform';
import type { CathedralGemStrike } from '../content/structures/cathedralGemStrike.types';
import type { Entity } from '../entities/Entity';
import { Cathedral } from '../entities/structures/Cathedral';
import type { GameState } from '../state/GameState';
import { DIRECT_HIT_KINDS } from './CathedralGemSystem.constants';
import type { GemHit } from './CathedralGemSystem.types';
import type { System, SystemContext } from './System.types';

/**
 * The Cathedral gem's lightning (DISC-11, architecture 07 §1): an attacker that hits the gem
 * directly (`DIRECT_HIT_KINDS`) is struck back through the damage pipeline, at most once per
 * cooldown and only within range. The gem is unbreakable, so its hits arrive as `damage-blocked`;
 * they are queued and struck on this system's next update, never inside another system's hit. A
 * strike that lands emits `structure-struck` and starts the gem's `StrikeCooldown`. Gem-only by
 * design until `INBOX.md` settles a general retaliation rule.
 */
export class CathedralGemSystem implements System {
  public readonly name = 'cathedral-gem';

  private readonly hits: GemHit[] = [];
  private readonly cooldownTicks: number;

  /**
   * @param state - The match whose `damage-blocked` events are listened to.
   * @param damage - The match's one damage pipeline, which every strike goes through.
   * @param strike - The strike's numbers (`content/structures/cathedralGemStrike.ts`).
   */
  public constructor(
    state: GameState,
    private readonly damage: DamagePipeline,
    private readonly strike: CathedralGemStrike,
  ) {
    this.cooldownTicks = Math.round(strike.cooldownSeconds * state.config.tickRate);
    state.events.on('damage-blocked', ({ targetId, source }) => {
      if (
        source.attackerId !== null &&
        DIRECT_HIT_KINDS.has(source.kind) &&
        state.entities.get(targetId) instanceof Cathedral
      ) {
        this.hits.push({ gemId: targetId, attackerId: source.attackerId });
      }
    });
  }

  /** Strikes back each queued hit, in hit order, while its gem is off cooldown. */
  public update({ state }: SystemContext): void {
    for (const { gemId, attackerId } of this.hits) {
      const gem = state.entities.get(gemId);
      const attacker = state.entities.get(attackerId);
      const cooldown = gem?.findComponent(StrikeCooldown);
      if (
        gem === undefined ||
        attacker === undefined ||
        cooldown?.isReady(state.tick) === false ||
        attacker.findComponent(Health)?.isDead !== false ||
        !this.isInRange(gem, attacker)
      ) {
        continue;
      }
      const result = this.damage.apply(state, attackerId, this.strike.damage, {
        attackerId: gemId,
        kind: 'structure',
        definitionId: gem.definitionId,
      });
      if (result.applied) {
        state.events.emit('structure-struck', { structureId: gemId, targetId: attackerId });
        const clock = cooldown ?? new StrikeCooldown();
        if (cooldown === undefined) gem.addComponent(clock);
        clock.recordStrike(state.tick, this.cooldownTicks);
      }
    }
    this.hits.length = 0;
  }

  private isInRange(gem: Entity, attacker: Entity): boolean {
    const from = gem.findComponent(Transform)?.position;
    const to = attacker.findComponent(Transform)?.position;
    if (from === undefined || to === undefined) {
      return false;
    }
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    return dx * dx + dy * dy <= this.strike.range * this.strike.range;
  }
}
