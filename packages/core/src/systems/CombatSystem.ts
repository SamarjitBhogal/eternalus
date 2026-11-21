import { Combat } from '../components/Combat';
import { Health } from '../components/Health';
import { StatusEffects } from '../components/StatusEffects';
import { Transform } from '../components/Transform';
import type { DamagePipeline } from '../combat/DamagePipeline';
import type { EntityFactory } from '../entities/EntityFactory';
import type { StrategyRegistry } from '../entities/strategies/defaultStrategyRegistry';
import { createDefaultStrategyRegistry } from '../entities/strategies/defaultStrategyRegistry';
import type { HitRunner } from '../state/HitRunner.types';
import type { LineOfFireQuery } from '../state/LineOfFire.types';
import type { MutableVec2 } from '../utils/vec2.types';
import type { CombatSystemOptions } from './CombatSystem.types';
import type { System, SystemContext } from './System.types';

/**
 * Lands the attacks of every unit with a target (architecture 05 §10): when the target is in reach
 * and the attack is off cooldown, the attack's strategy hits it through the damage pipeline. A unit
 * with a target in reach faces it every tick, after `MovementSystem`, so attacking outranks moving
 * (DEC-192): it faces `EntityStore.facingPointOf`, a building's outline point nearest it or a
 * unit's centre (DEC-216 (11)), or a building's centre from inside its outline (DEC-220 (1)). A
 * dead or removed target clears. Statuses stop attacks (`cannot-attack`) and scale the cooldown
 * (`attackSpeed`). The attack strategy runs the attacker's statuses' `onHit` steps where the hit
 * lands (`HitEffects`: Fury's knock-back). While the match holds units idle
 * (`state.match.isIdleHeld`, the countdown) no attack lands, no unit turns to its target, and
 * targets are kept for after. A ranged attack fires a shot (the match's one `EntityFactory` builds
 * it) only when the shot would reach the target (`LineOfFire`, DEC-317); else the unit faces the
 * target, keeps it and stays ready, and its controller moves it. `ProjectileSystem`, right before
 * this system, flies and lands the shots. Getting into reach
 * is the controller's job (moving), not this system's.
 */
export class CombatSystem implements System {
  public readonly name = 'combat';
  /** Scratch for the point the attacker faces. */
  private readonly aim: MutableVec2 = { x: 0, y: 0 };
  private readonly damage: DamagePipeline;
  private readonly hits: HitRunner | null;
  private readonly strategies: StrategyRegistry;
  private readonly factory: EntityFactory;
  private readonly lineOfFire: LineOfFireQuery;

  /** Creates the system from its injected parts (`CombatSystemOptions`). */
  public constructor({
    damage,
    factory,
    lineOfFire,
    hits = null,
    strategies = createDefaultStrategyRegistry(),
  }: CombatSystemOptions) {
    this.damage = damage;
    this.factory = factory;
    this.lineOfFire = lineOfFire;
    this.hits = hits;
    this.strategies = strategies;
  }

  /** Runs each attacker in store order. */
  public update({ state }: SystemContext): void {
    if (state.match.isIdleHeld) {
      return;
    }
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
      if (
        !combat.canAttack(state.tick) ||
        !this.lineOfFire.isClear(state, attacker.id, target.id)
      ) {
        return;
      }

      this.strategies.attack[combat.attack.strategy].attack(attacker, target.id, combat.attack, {
        state,
        damage: this.damage,
        hits: this.hits,
        factory: this.factory,
      });
      combat.beginAttack(state.tick, statuses?.multiplier('attackSpeed') ?? 1);
    });
  }
}
