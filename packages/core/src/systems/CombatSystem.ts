import { Combat } from '../components/Combat';
import { Health } from '../components/Health';
import { StatusEffects } from '../components/StatusEffects';
import { Transform } from '../components/Transform';
import type { DamagePipeline } from '../combat/DamagePipeline';
import type { Entity } from '../entities/Entity';
import type { StrategyRegistry } from '../entities/strategies/defaultStrategyRegistry';
import { createDefaultStrategyRegistry } from '../entities/strategies/defaultStrategyRegistry';
import { length, sub } from '../utils/vec2';
import type { System, SystemContext } from './System.types';

/**
 * Lands the attacks of every unit with a target (architecture 05 §10): when the target is in reach
 * and the attack is off cooldown, the attack's strategy hits it through the damage pipeline. A dead
 * or removed target clears. Statuses stop attacks (`cannot-attack`, or an `attackSpeed` of 0) and
 * scale the cooldown. Getting into reach is the controller's job (moving), not this system's.
 */
export class CombatSystem implements System {
  public readonly name = 'combat';

  /**
   * @param damage - The match's one damage pipeline, shared with every system that deals damage.
   * @param strategies - The strategy registry; attacks use `strategies.attack`.
   */
  public constructor(
    private readonly damage: DamagePipeline,
    private readonly strategies: StrategyRegistry = createDefaultStrategyRegistry(),
  ) {}

  /** Runs each attacker in store order. */
  public update({ state }: SystemContext): void {
    state.entities.forEach((attacker) => {
      const combat = attacker.findComponent(Combat);
      if (combat?.targetId == null) {
        return;
      }

      const target = state.entities.get(combat.targetId);
      if (target === undefined || target.findComponent(Health)?.isDead !== false) {
        combat.setTarget(null);
        return;
      }
      const statuses = attacker.findComponent(StatusEffects);
      const attackSpeed = statuses?.multiplier('attackSpeed') ?? 1;
      if (statuses?.has('cannot-attack') === true || attackSpeed === 0) {
        return;
      }
      if (!combat.canAttack(state.tick) || !CombatSystem.inReach(attacker, target, combat)) {
        return;
      }

      this.strategies.attack[combat.attack.strategy].attack(attacker, target.id, combat.attack, {
        state,
        damage: this.damage,
      });
      combat.beginAttack(state.tick, attackSpeed);
    });
  }

  /** Edge-to-edge distance between the two footprints is within the attack's reach. */
  private static inReach(attacker: Entity, target: Entity, combat: Combat): boolean {
    const from = attacker.findComponent(Transform);
    const to = target.findComponent(Transform);
    if (from === undefined || to === undefined) {
      return false;
    }
    const gap = length(sub(to.position, from.position)) - from.radius - to.radius;
    return gap <= combat.attack.reach;
  }
}
