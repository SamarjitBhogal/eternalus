import { Combat } from '../components/Combat';
import { Health } from '../components/Health';
import { StatusEffects } from '../components/StatusEffects';
import { Transform } from '../components/Transform';
import type { DamagePipeline } from '../combat/DamagePipeline';
import type { EntityFactory } from '../entities/EntityFactory';
import type { StrategyRegistry } from '../entities/strategies/defaultStrategyRegistry';
import { createDefaultStrategyRegistry } from '../entities/strategies/defaultStrategyRegistry';
import type { AreaHitQuery } from '../state/AreaHitQuery';
import type { ReachQuery } from '../state/ReachQuery';
import type { HitRunner } from '../state/HitRunner.types';
import { normalizeInto } from '../utils/vec2';
import type { MutableVec2 } from '../utils/vec2.types';
import type { Entity } from '../entities/Entity';
import type { AttackAim } from '../entities/strategies/AttackStrategy.types';
import type { GameState } from '../state/GameState';
import type { Vec2 } from '../utils/geometry.types';
import type { CombatSystemOptions } from './CombatSystem.types';
import type { System, SystemContext } from './System.types';

/**
 * Lands the attacks of every unit with a target (architecture 05 §10): when the target is in reach
 * and the attack is off cooldown, the attack's strategy hits it through the damage pipeline. A unit
 * with a target in reach faces it every tick, after `MovementSystem`, so attacking outranks moving
 * (DEC-192): it faces `ReachQuery.facingPointOf`, a building's outline point nearest it or a
 * unit's centre (DEC-216 (11)), or a building's centre from inside its outline (DEC-220 (1)). A
 * dead or removed target clears. Statuses stop attacks (`cannot-attack`) and scale the cooldown
 * (`attackSpeed`). The attack strategy runs the attacker's statuses' `onHit` steps where the hit
 * lands (`HitEffects`: Fury's knock-back). While the match holds units idle
 * (`state.match.isIdleHeld`, the countdown) no attack lands, no unit turns to its target, and
 * targets are kept for after. An attacker killed earlier in the tick lands nothing. A ranged
 * attack fires a shot (the match's one `EntityFactory` builds it) with no line-of-fire check, for
 * every unit (DEC-317 addendum): a shot into a wall ends there. A bot whose shot a wall would stop
 * drops its target and moves (`BotLeaves`). `ProjectileSystem`, right before this system, flies
 * and lands the shots. Getting into reach is the controller's job (moving), not this system's.
 *
 * A unit with an aim point instead of a target (`attack-aim`, DEC-184) attacks along the line to
 * that point whenever the attack is off cooldown: it faces the point every tick, with no reach
 * check (a shot into a wall just ends there, a sweep hits what its wedge reaches). The strategies
 * get the aim point, and the one hit rule for areas (`AreaHitQuery`), so a sweep or a shot hits a
 * walk-on outline only when it aims at it (DEC-322 (1)).
 */
export class CombatSystem implements System {
  public readonly name = 'combat';
  /** Scratch for the point the attacker faces. */
  private readonly facePoint: MutableVec2 = { x: 0, y: 0 };
  /** Scratch for the unit vector an attack is aimed along. */
  private readonly direction: MutableVec2 = { x: 0, y: 0 };
  private readonly damage: DamagePipeline;
  private readonly hits: HitRunner | null;
  private readonly strategies: StrategyRegistry;
  private readonly factory: EntityFactory;
  /** The match's one hit rule for areas, which the sweep and the shot apply. */
  private readonly areas: AreaHitQuery;
  /** The match's one aim rule: reach and the point a unit faces. */
  private readonly reach: ReachQuery;

  /** Creates the system from its injected parts (`CombatSystemOptions`). */
  public constructor({
    damage,
    factory,
    areas,
    reach,
    hits = null,
    strategies = createDefaultStrategyRegistry(),
  }: CombatSystemOptions) {
    this.damage = damage;
    this.factory = factory;
    this.areas = areas;
    this.reach = reach;
    this.hits = hits;
    this.strategies = strategies;
  }

  /**
   * Runs each attacker in store order.
   *
   * @throws Error when an attacker in reach of its target has no point to face on it (a broken
   *   `ReachQuery` invariant: `isInReach` and `facingPointOf` measure to the same point).
   */
  public update({ state }: SystemContext): void {
    if (state.match.isIdleHeld) {
      return;
    }
    state.entities.forEach((attacker) => {
      const combat = attacker.findComponent(Combat);
      // An attacker killed earlier in this tick (a shot, an ability) lands nothing.
      if (combat === undefined || attacker.findComponent(Health)?.isDead === true) {
        return;
      }
      if (combat.aimPoint !== null) {
        this.attackAimPoint(state, attacker, combat, combat.aimPoint);
        return;
      }
      if (combat.targetId === null) {
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
      if (!this.reach.isInReach(state.entities, attacker.id, target.id)) {
        return;
      }
      const transform = attacker.getComponent(Transform);
      if (!this.reach.facingPointOf(state.entities, attacker.id, target.id, this.facePoint)) {
        // `isInReach` above already found the point reach is measured to.
        throw new Error(
          `Entity "${attacker.id}" has no point to face on its target "${target.id}".`,
        );
      }
      transform.lookAt(this.facePoint);
      if (!combat.canAttack(state.tick)) {
        return;
      }

      this.land(state, attacker, combat, {
        targetId: target.id,
        point: null,
        direction: this.directionTo(transform, this.facePoint),
      });
    });
  }

  /**
   * An aimed attack: face the point every tick, and when off cooldown attack along the line to it
   * with no target. Does nothing under `cannot-attack`.
   */
  private attackAimPoint(state: GameState, attacker: Entity, combat: Combat, point: Vec2): void {
    if (attacker.findComponent(StatusEffects)?.has('cannot-attack') === true) {
      return;
    }
    const transform = attacker.getComponent(Transform);
    transform.lookAt(point);
    if (combat.canAttack(state.tick)) {
      this.land(state, attacker, combat, {
        targetId: null,
        point,
        direction: this.directionTo(transform, point),
      });
    }
  }

  /** Runs the attack's strategy along `aim`, then puts the attack on cooldown. */
  private land(state: GameState, attacker: Entity, combat: Combat, aim: AttackAim): void {
    this.strategies.attack[combat.attack.strategy].attack(attacker, aim, combat.attack, {
      state,
      damage: this.damage,
      hits: this.hits,
      factory: this.factory,
      areas: this.areas,
    });
    combat.beginAttack(state.tick, state.entities.attackSpeedOf(attacker.id));
  }

  /** The unit vector from the attacker to `point` (scratch); its facing when it stands on it. */
  private directionTo(transform: Transform, point: Vec2): Vec2 {
    const { position, facing } = transform;
    normalizeInto(this.direction, { x: point.x - position.x, y: point.y - position.y });
    if (this.direction.x === 0 && this.direction.y === 0) {
      this.direction.x = facing.x;
      this.direction.y = facing.y;
    }
    return this.direction;
  }
}
