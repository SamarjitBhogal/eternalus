import type { Aim } from '../commands/Command.types';
import type { AbilitySlot } from '../content/abilities/AbilityDefinition.types';
import type { EntityId } from '../state/EntityStore.types';
import type { GameState } from '../state/GameState';
import type { SlotReadiness } from '../state/SlotReadiness.types';
import type { Ability } from './AbilityRegistry.types';
import type { CastRejectReason } from './CastValidator.types';
import { CastValidator } from './CastValidator';

/**
 * The `SlotReadiness` of a match (architecture 05 §15): the same `CastValidator` the `cast-ability`
 * handler uses, so the HUD and the bots read the rules a cast is judged by. `Simulation` injects
 * it into `state/` and `ai/`, which may not import `abilities/`.
 */
export class CastReadiness implements SlotReadiness {
  private readonly validator: CastValidator;

  /** @param registry - Where abilities are composed (`AbilityRegistry`). */
  public constructor(private readonly registry: { resolve(abilityId: string): Ability }) {
    this.validator = new CastValidator(registry);
  }

  /** Why the cast is refused now, or `null` (see `CastValidator.check`). */
  public blockedBy(
    state: GameState,
    actorId: EntityId,
    slot: AbilitySlot,
    aim: Aim,
  ): CastRejectReason | null {
    return this.validator.check(state, actorId, slot, aim);
  }

  /** The price after the caster's status modifiers. */
  public priceOf(state: GameState, actorId: EntityId, abilityId: string): number {
    return this.validator.price(state, actorId, this.registry.resolve(abilityId));
  }

  /** The ability's full cooldown in ticks. */
  public cooldownTicksOf(abilityId: string): number {
    return this.registry.resolve(abilityId).definition.cooldownTicks;
  }
}
