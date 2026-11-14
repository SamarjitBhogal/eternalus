import { Abilities } from '../components/Abilities';
import type { CastAim } from '../components/AbilitySlotRuntime.types';
import { Aether } from '../components/Aether';
import { Health } from '../components/Health';
import { StatusEffects } from '../components/StatusEffects';
import { Transform } from '../components/Transform';
import type { AbilitySlot } from '../content/abilities/AbilityDefinition.types';
import type { EntityId } from '../state/EntityStore.types';
import type { GameState } from '../state/GameState';
import type { Ability } from './AbilityRegistry.types';
import type { CastRejectReason } from './CastValidator.types';

/**
 * Decides whether a caster may cast a slot now (architecture 05 §6, §7). The `cast-ability`
 * handler asks it before it queues a cast, and `AbilitySystem` asks again before the cast runs.
 * The checks, in order (the first that fails is the reason): the caster exists and is alive, the
 * slot holds an ability, the ability is built (`unavailable`), no other cast of the caster waits
 * (`casting`), the match does not hold units idle and no status forbids casting (`cannot-cast`:
 * the countdown is a freeze, DEC-88), the cooldown is over, an ultimate's meter is full
 * (`not-charged`), the aether covers the price, a directional cast has a direction (`no-target`),
 * then each restriction in content order. A refused cast spends nothing and starts no cooldown.
 */
export class CastValidator {
  /** @param registry - Where abilities are composed (`AbilityRegistry`). */
  public constructor(private readonly registry: { resolve(abilityId: string): Ability }) {}

  /** Why `actorId` may not cast `slot` aimed at `aim` now, or `null` when it may. */
  public check(
    state: GameState,
    actorId: EntityId,
    slot: AbilitySlot,
    aim: CastAim,
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

  /**
   * What `ability` costs `actorId` now: its `aetherCost` times the caster's `aetherCost` status
   * multiplier (concussion's +25%, more-abilities.md §7).
   */
  public price(state: GameState, actorId: EntityId, ability: Ability): number {
    const multiplier =
      state.entities.get(actorId)?.findComponent(StatusEffects)?.multiplier('aetherCost') ?? 1;
    return ability.definition.aetherCost * multiplier;
  }

  /** Whether the aim point lies a finite, non-zero distance from the caster. */
  private static hasDirection(transform: Transform | undefined, { point }: CastAim): boolean {
    if (transform === undefined) {
      return false;
    }
    const dx = point.x - transform.position.x;
    const dy = point.y - transform.position.y;
    return Number.isFinite(dx) && Number.isFinite(dy) && (dx !== 0 || dy !== 0);
  }
}
