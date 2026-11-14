import type { AbilityRegistry } from '../abilities/AbilityRegistry';
import { CastInstance } from '../abilities/CastInstance';
import type { CastValidator } from '../abilities/CastValidator';
import { TargetQuery } from '../abilities/TargetQuery';
import type { DamagePipeline } from '../combat/DamagePipeline';
import type { Command } from '../commands/Command.types';
import type { StatusEffectApplier } from '../combat/StatusEffectApplier';
import { Abilities } from '../components/Abilities';
import type { AbilitySlotRuntime } from '../components/AbilitySlotRuntime';
import { Aether } from '../components/Aether';
import { Progression } from '../components/Progression';
import { Transform } from '../components/Transform';
import type { Entity } from '../entities/Entity';
import type { GameState } from '../state/GameState';
import { compareById } from '../utils/compareById';
import type { System, SystemContext } from './System.types';

/**
 * Runs the casts the `cast-ability` handler queued this tick (architecture 05 §7 step 3), casters
 * in id order. Each cast is checked again (the state may have moved since the command); a cast
 * that now fails is announced as `command-rejected` and dropped. Otherwise it pays the price in
 * aether, stamps the cooldown (cooldowns start at cast), emits `ability-cast` and fires the
 * ability's steps through their strategies. Runs after `HordeSystem` and before
 * `StatusEffectSystem` (plan arch call 13).
 */
export class AbilitySystem implements System {
  public readonly name = 'abilities';

  private readonly targets: TargetQuery;

  /**
   * @param registry - Where abilities are composed and effects found.
   * @param validator - The cast rules, the same the handler checks with.
   * @param damage - The match's one damage pipeline, for the effects.
   * @param statuses - The match's one status applier, for the effects.
   */
  public constructor(
    private readonly registry: AbilityRegistry,
    private readonly validator: CastValidator,
    private readonly damage: DamagePipeline,
    private readonly statuses: StatusEffectApplier,
  ) {
    this.targets = new TargetQuery(registry);
  }

  /** Runs every queued cast of this tick, casters in id order. */
  public update({ state }: SystemContext): void {
    const queued: { readonly caster: Entity; readonly runtime: AbilitySlotRuntime }[] = [];
    state.entities.forEach((caster) => {
      for (const runtime of caster.findComponent(Abilities)?.slots ?? []) {
        if (runtime.pendingCast !== null) {
          queued.push({ caster, runtime });
        }
      }
    });
    queued.sort((a, b) => compareById(a.caster.id, b.caster.id));
    for (const { caster, runtime } of queued) {
      this.cast(state, caster, runtime);
    }
  }

  private cast(state: GameState, caster: Entity, runtime: AbilitySlotRuntime): void {
    const aim = runtime.takePending();
    const { abilityId, slot } = runtime;
    if (aim === null || abilityId === null) {
      return;
    }
    const reason = this.validator.check(state, caster.id, slot, aim);
    if (reason !== null) {
      const command: Command<'cast-ability'> = {
        type: 'cast-ability',
        actorId: caster.id,
        slot,
        aim,
      };
      state.events.emit('command-rejected', { command, reason });
      return;
    }
    const ability = this.registry.resolve(abilityId);
    const price = this.validator.price(state, caster.id, ability);
    if (price > 0) {
      caster.getComponent(Aether).spend(price);
    }
    runtime.recordCast(state.tick, ability.definition.cooldownTicks);
    state.events.emit('ability-cast', { casterId: caster.id, abilityId, slot });
    const { position } = caster.getComponent(Transform);
    new CastInstance(
      {
        casterId: caster.id,
        ability,
        slot,
        aim,
        origin: { x: position.x, y: position.y },
        casterLevel: caster.findComponent(Progression)?.level ?? 1,
        tick: state.tick,
      },
      {
        state,
        effects: this.registry,
        targets: this.targets,
        damage: this.damage,
        statuses: this.statuses,
      },
    ).run();
  }
}
