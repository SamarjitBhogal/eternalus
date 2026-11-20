import { Abilities } from '../components/Abilities';
import type { Aim } from '../components/AbilitySlotRuntime.types';
import { Aether } from '../components/Aether';
import { Health } from '../components/Health';
import { StatusEffects } from '../components/StatusEffects';
import { Transform } from '../components/Transform';
import type {
  AbilityRejectReason,
  AbilitySlot,
} from '../content/abilities/AbilityDefinition.types';
import type { EntityId } from '../state/EntityStore.types';
import type { GameState } from '../state/GameState';
import type { SlotReadiness } from '../state/SlotReadiness.types';
import type { Ability } from './AbilityRegistry.types';
import type { CastRejectReason } from './CastValidator.types';

/**
 * Decides whether a caster may cast a slot now (architecture 05 §6, §7): the one cast rule of a
 * match. `Simulation` builds one and injects it, as the `SlotReadiness` port, into the
 * `cast-ability` handler, the player snapshot and the bots, and gives it to `AbilitySystem`, which
 * asks again before the cast runs (ADR 0026 decision 2).
 * The checks, in order (the first that fails is the reason): the caster exists and is alive, the
 * slot holds an ability, the ability is built (`unavailable`), no other cast of the caster waits
 * (`casting`), the match does not hold units idle and no status forbids casting (`cannot-cast`:
 * the countdown is a freeze, DEC-88), the cooldown is over, an ultimate's meter is full
 * (`not-charged`), the aether covers the price, a directional cast has a direction (`no-target`),
 * then each restriction in content order. `slotBlockedBy` runs the same checks without the aim's.
 * A refused cast spends nothing and starts no cooldown.
 */
export class CastValidator implements SlotReadiness {
  /** @param registry - Where abilities are composed (`AbilityRegistry`). */
  public constructor(private readonly registry: { resolve(abilityId: string): Ability }) {}

  /**
   * Why `actorId` may not cast `slot` now whatever the aim, or `null`: the slot's own state, for
   * the player snapshot.
   *
   * @throws Error when `actorId` names no entity.
   */
  public slotBlockedBy(
    state: GameState,
    actorId: EntityId,
    slot: AbilitySlot,
  ): AbilityRejectReason | null {
    const reason = this.blockedBy(state, actorId, slot, null);
    if (reason === 'unknown-entity') {
      throw new Error(`CastValidator: no entity "${actorId}" to judge slot ${slot} of.`);
    }
    return reason;
  }

  /**
   * What `abilityId` costs `actorId` now: its `aetherCost` times the caster's `aetherCost` status
   * multiplier (concussion's +25%, more-abilities.md §7).
   */
  public priceOf(state: GameState, actorId: EntityId, abilityId: string): number {
    return this.price(state, actorId, this.registry.resolve(abilityId));
  }

  /** The full cooldown of `abilityId` in ticks. */
  public cooldownTicksOf(abilityId: string): number {
    return this.registry.resolve(abilityId).definition.cooldownTicks;
  }

  /**
   * Why `actorId` may not cast `slot` aimed at `aim` now, or `null` when it may: the checks in
   * order, the aim's only when `aim` is given (`slotBlockedBy` passes `null`).
   */
  public blockedBy(
    state: GameState,
    actorId: EntityId,
    slot: AbilitySlot,
    aim: Aim | null,
  ): CastRejectReason | null {
    const caster = state.entities.get(actorId);
    if (caster === undefined) {
      return 'unknown-entity';
    }
    if (caster.findComponent(Health)?.isDead === true) {
      return 'dead';
    }
    const abilities = caster.findComponent(Abilities);
    const runtime = abilities?.slot(slot);
    if (abilities === undefined || runtime?.abilityId == null) {
      return 'empty-slot';
    }
    const ability = this.registry.resolve(runtime.abilityId);
    const { definition } = ability;
    if (!ability.isAvailable) {
      return 'unavailable';
    }
    if (abilities.hasPendingCast) {
      return 'casting';
    }
    if (
      state.match.isIdleHeld ||
      caster.findComponent(StatusEffects)?.has('cannot-cast') === true
    ) {
      return 'cannot-cast';
    }
    if (runtime.isCoolingDown(state.tick)) {
      return 'on-cooldown';
    }
    if (definition.slot === 'ultimate' && runtime.charge < 1) {
      return 'not-charged';
    }
    if (caster.findComponent(Aether)?.canAfford(this.price(state, actorId, ability)) !== true) {
      return 'not-enough-aether';
    }
    if (
      aim !== null &&
      definition.targeting?.kind === 'directional' &&
      !CastValidator.hasDirection(caster.findComponent(Transform), aim)
    ) {
      return 'no-target';
    }
    for (const { rule, spec } of ability.restrictions) {
      const reason = rule.check(spec, actorId, state);
      if (reason !== null) {
        return reason;
      }
    }
    return null;
  }

  /** The price of an ability already resolved (see `priceOf`). */
  private price(state: GameState, actorId: EntityId, ability: Ability): number {
    const multiplier =
      state.entities.get(actorId)?.findComponent(StatusEffects)?.multiplier('aetherCost') ?? 1;
    return ability.definition.aetherCost * multiplier;
  }

  /** Whether the aim point lies a finite, non-zero distance from the caster. */
  private static hasDirection(transform: Transform | undefined, { point }: Aim): boolean {
    if (transform === undefined) {
      return false;
    }
    const dx = point.x - transform.position.x;
    const dy = point.y - transform.position.y;
    return Number.isFinite(dx) && Number.isFinite(dy) && (dx !== 0 || dy !== 0);
  }
}
