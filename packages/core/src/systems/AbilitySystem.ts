import { Aether } from '../components/Aether';
import { Health } from '../components/Health';
import { AbilityRuntime } from '../components/AbilityRuntime';
import { StatusEffects } from '../components/StatusEffects';
import { MAGUS_RESOURCES } from '../content/abilities/magusKit';
import { createDefaultAbilityEffects } from '../abilities/defaultAbilityEffects';
import { abilityBlockReason } from '../abilities/abilityBlockReason';
import type { AbilityEffectContext } from '../abilities/AbilityEffect.types';
import type { DamagePipeline } from '../combat/DamagePipeline';
import type { StatusEffectApplier } from '../combat/StatusEffectApplier';
import type { EntityFactory } from '../entities/EntityFactory';
import type { GameState } from '../state/GameState';
import type { System, SystemContext } from './System.types';

/** Resolves queued casts once, paying actual aether and observing cooldown and control locks. */
export class AbilitySystem implements System {
  public readonly name = 'abilities';
  private readonly effects = createDefaultAbilityEffects();
  /** Injects the match's shared services and listens for ultimate-meter rewards. */
  public constructor(
    state: GameState,
    private readonly factory: EntityFactory,
    private readonly damage: DamagePipeline,
    private readonly statuses: StatusEffectApplier,
  ) {
    state.events.on('entity-died', ({ entityId, killer }) => {
      const runtime = state.entities.get(killer.attackerId ?? '')?.findComponent(AbilityRuntime);
      const victim = state.entities.get(entityId);
      if (runtime !== undefined && (victim?.family === 'legend' || victim?.family === 'mob'))
        runtime.addCharge(
          victim.family === 'legend' ? MAGUS_RESOURCES.legendKill : MAGUS_RESOURCES.minionKill,
          MAGUS_RESOURCES.ultimateMax,
        );
      victim
        ?.findComponent(AbilityRuntime)
        ?.addCharge(-MAGUS_RESOURCES.deathLoss, MAGUS_RESOURCES.ultimateMax);
    });
    state.events.on('damage-applied', ({ targetId, amount, source }) => {
      const target = state.entities.get(targetId),
        health = target?.findComponent(Health);
      const fraction =
        target?.family === 'structure'
          ? MAGUS_RESOURCES.structureDamageFraction
          : target?.family === 'boss'
            ? MAGUS_RESOURCES.bossDamageFraction
            : null;
      if (fraction !== null && health !== undefined)
        state.entities
          .get(source.attackerId ?? '')
          ?.findComponent(AbilityRuntime)
          ?.addCharge(amount / (health.max * fraction), MAGUS_RESOURCES.ultimateMax);
    });
  }
  /** All decisions depend only on ticks, entity components and the authored kit. */
  public update({ state }: SystemContext): void {
    state.entities.forEach((caster) => {
      const runtime = caster.findComponent(AbilityRuntime),
        aether = caster.findComponent(Aether);
      if (runtime === undefined || aether === undefined) return;
      const requests = runtime.drain();
      if (state.match.isIdleHeld || caster.findComponent(Health)?.isDead !== false) return;
      if (runtime.hasGameplayAbilities)
        aether.restore(MAGUS_RESOURCES.aetherPerSecond / state.config.tickRate);
      for (const request of requests) {
        const ability = runtime.kit.find((entry) => entry.slot === request.slot);
        if (ability === undefined) continue;
        const isUltimate = ability.slot === 'ability-4';
        const reason = abilityBlockReason(
          ability,
          runtime,
          state.tick,
          aether.current,
          false,
          caster.findComponent(StatusEffects)?.has('cannot-cast') === true,
        );
        if (reason !== null) {
          state.events.emit('command-rejected', { command: { type: 'cast-ability' }, reason });
          continue;
        }
        if (ability.isPreview === true) {
          runtime.preview(ability, state.tick);
          state.events.emit('ability-previewed', { casterId: caster.id, abilityId: ability.id });
          continue;
        }
        aether.spend(ability.aetherCost);
        if (isUltimate)
          runtime.addCharge(-MAGUS_RESOURCES.ultimateMax, MAGUS_RESOURCES.ultimateMax);
        runtime.cast(
          ability,
          state.tick,
          Math.round(ability.cooldownSeconds * state.config.tickRate),
        );
        const context: AbilityEffectContext = {
          state,
          caster,
          abilityId: ability.id,
          point: request.point,
          factory: this.factory,
          damage: this.damage,
          statuses: this.statuses,
        };
        for (const spec of ability.effects) {
          this.effects[spec.kind].apply(spec, context);
        }
        state.events.emit('ability-cast', {
          casterId: caster.id,
          abilityId: ability.id,
          slot: ability.slot,
        });
      }
    });
  }
}
