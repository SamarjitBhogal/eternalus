import { Combat } from '../components/Combat';
import { Health } from '../components/Health';
import { StatusEffects } from '../components/StatusEffects';
import { Transform } from '../components/Transform';
import type { DamagePipeline } from '../combat/DamagePipeline';
import type { StrategyRegistry } from '../entities/strategies/defaultStrategyRegistry';
import { createDefaultStrategyRegistry } from '../entities/strategies/defaultStrategyRegistry';
import type { MutableVec2 } from '../utils/vec2.types';
import type { System, SystemContext } from './System.types';

/**
 * Lands the attacks of every unit with a target (architecture 05 §10): when the target is in reach
 * and the attack is off cooldown, the attack's strategy hits it through the damage pipeline. A unit
 * with a target in reach faces it every tick, after `MovementSystem`, so attacking outranks moving
 * (DEC-192): it faces `EntityStore.facingPointOf`, a building's outline point nearest it or a
 * unit's centre (DEC-216 (11)), or a building's centre from inside its outline (DEC-220 (1)). A
 * dead or removed target clears.
 * Statuses stop attacks (`cannot-attack`) and scale the cooldown (`attackSpeed`). Getting into
 * reach is the controller's job (moving), not this system's.
 */
export class CombatSystem implements System {
  public readonly name = 'combat';
  /** Scratch for the point the attacker faces. */
  private readonly aim: MutableVec2 = { x: 0, y: 0 };

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
      if (statuses?.has('cannot-attack') === true) {
        return;
      }
      if (!state.entities.isInReach(attacker.id, target.id)) {
        return;
      }
      if (state.entities.facingPointOf(attacker.id, target.id, this.aim)) {
        attacker.getComponent(Transform).lookAt(this.aim);
      }
      if (!combat.canAttack(state.tick)) {
        return;
      }

      this.strategies.attack[combat.attack.strategy].attack(attacker, target.id, combat.attack, {
        state,
        damage: this.damage,
      });
      combat.beginAttack(state.tick, statuses?.multiplier('attackSpeed') ?? 1);
    });
  }
}
