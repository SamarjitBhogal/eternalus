import type { DamagePipeline } from '../combat/DamagePipeline';
import type { StatusEffectApplier } from '../combat/StatusEffectApplier';
import { Combat } from '../components/Combat';
import { Progression } from '../components/Progression';
import type { StatusEffectRuntime } from '../components/StatusEffectRuntime';
import { StatusEffects } from '../components/StatusEffects';
import { Transform } from '../components/Transform';
import type { AbilityEffectSpec } from '../content/abilities/AbilityDefinition.types';
import type { UnitAttack } from '../content/units/units.types';
import type { EntityId } from '../state/EntityStore.types';
import type { GameState } from '../state/GameState';
import type { AbilityRegistry } from './AbilityRegistry';
import { CastInstance } from './CastInstance';
import type { LandedHit } from './HitEffects.types';
import { TargetQuery } from './TargetQuery';

/**
 * Runs the on-hit steps each time a basic attack lands (architecture 05 §8, §10): the attack's own
 * `onHit` (05 §10 `WeaponAttack.onHit`; a heavy bolt's concussion), then the `onHit` of each of the
 * attacker's statuses (Fury's knock-back). Each list runs as one cast through the registry's
 * strategies, as an ability's steps do (`CastInstance`): credited to the attacker, from the
 * `default-action` slot (the basic attack), aimed at the struck body and placed from the attacker
 * to it, which the `hit` shape reads. The attack's cast is named after the attacker's weapon, or
 * its definition when it has none (a turret), as the attack's damage source is
 * (`weaponSourceOf`); a status's after the status. The attack strategy calls it where the hit
 * lands (`MeleeAttackStrategy` in the tick, `WeaponImpact` when a shot lands).
 */
export class HitEffects {
  /** What `afterHit` reads for an attacker with no `StatusEffects`. */
  private static readonly NO_STATUSES: readonly StatusEffectRuntime[] = [];

  /** What `afterHit` reads for an attack with no `onHit` steps. */
  private static readonly NO_STEPS: readonly AbilityEffectSpec[] = [];

  private readonly targets: TargetQuery;

  /**
   * @param registry - Where effect and shape strategies are found (the `AbilityRegistry`).
   * @param damage - The match's one damage pipeline, for the steps.
   * @param statuses - The match's one status applier, for the steps.
   */
  public constructor(
    private readonly registry: Pick<AbilityRegistry, 'effectFor' | 'shapeFor'>,
    private readonly damage: DamagePipeline,
    private readonly statuses: StatusEffectApplier,
  ) {
    this.targets = new TargetQuery(registry);
  }

  /**
   * Runs the `onHit` steps of `attack`, then those of every status on `attackerId`, oldest status
   * first, for the basic attack that just struck `targetId`. Nothing runs, and nothing is
   * allocated (NFR-023), when neither the attack nor any status has `onHit` steps; nothing runs
   * when either entity is gone or has no position.
   *
   * @param attack - The attack that struck; absent runs only the statuses' steps.
   */
  public afterHit(
    state: GameState,
    attackerId: EntityId,
    targetId: EntityId,
    attack?: UnitAttack,
  ): void {
    const attacker = state.entities.get(attackerId);
    const active = attacker?.findComponent(StatusEffects)?.active ?? HitEffects.NO_STATUSES;
    const position = attacker?.findComponent(Transform)?.position;
    const struck = state.entities.get(targetId)?.findComponent(Transform)?.position;
    const steps = attack?.onHit ?? HitEffects.NO_STEPS;
    if (
      attacker === undefined ||
      position === undefined ||
      struck === undefined ||
      (steps.length === 0 && !HitEffects.hasOnHit(active))
    ) {
      return;
    }
    const hit: LandedHit = {
      casterId: attacker.id,
      casterLevel: attacker.findComponent(Progression)?.level ?? 1,
      targetId,
      from: { x: position.x, y: position.y },
      to: { x: struck.x, y: struck.y },
    };
    if (steps.length > 0) {
      this.run(
        state,
        hit,
        attacker.findComponent(Combat)?.weaponId ?? attacker.definitionId,
        steps,
      );
    }
    // Only the statuses active at the hit: a step may add one to the attacker (a buff on hit).
    for (let index = 0, count = active.length; index < count; index += 1) {
      const definition = active[index]?.definition;
      if (definition?.onHit !== undefined) {
        this.run(state, hit, definition.id, definition.onHit);
      }
    }
  }

  /** Runs `steps` as one cast named `id`, by the attacker of `hit`, at the struck body. */
  private run(
    state: GameState,
    { casterId, casterLevel, targetId, from, to }: LandedHit,
    id: string,
    steps: readonly AbilityEffectSpec[],
  ): void {
    // ponytail: steps bound and one CastInstance per hit, fine at a few hits a second; cache the
    // bound steps per status or attack if on-hit steps become common.
    new CastInstance(
      {
        casterId,
        ability: {
          id,
          steps: steps.map((spec) => ({
            effect: this.registry.effectFor(spec.kind),
            spec,
            delayTicks: 0, // an on-hit step never waits: it runs where the hit lands
          })),
          definition: { scaling: {} },
        },
        slot: 'default-action',
        aim: { point: to, targetId },
        origin: from,
        casterLevel,
        tick: state.tick,
      },
      {
        state,
        effects: this.registry,
        targets: this.targets,
        damage: this.damage,
        statuses: this.statuses,
      },
    ).run({ from, to });
  }

  /** Whether any of `active` has `onHit` steps; a loop, so a hit with none allocates nothing. */
  private static hasOnHit(active: readonly StatusEffectRuntime[]): boolean {
    for (let index = 0, count = active.length; index < count; index += 1) {
      if (active[index]?.definition.onHit !== undefined) {
        return true;
      }
    }
    return false;
  }
}
