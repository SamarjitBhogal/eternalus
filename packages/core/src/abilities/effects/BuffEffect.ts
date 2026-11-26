import { StatusEffects } from '../../components/StatusEffects';
import { Transform } from '../../components/Transform';
import type {
  AbilityRejectReason,
  BuffSpec,
} from '../../content/abilities/AbilityDefinition.types';
import type { AbilityDisplayStep } from '../../content/loadDisplayContent';
import type { AuthoredStatusEffect } from '../../content/status-effects/statusEffects.types';
import type { EntityId } from '../../state/EntityStore.types';
import type { GameState } from '../../state/GameState';
import { placeWithRoom } from '../../state/placeWithRoom';
import type { AbilityEffect, CastContext } from '../AbilityEffect.types';
import { mustBePositive } from '../specChecks';

/**
 * Applies a status to the caster itself through the match's one `StatusEffectApplier`
 * (architecture 05 §3, §8), credited to the caster: Fury's `fury`. A step's `durationTicks`
 * overrides the status's own duration for this application; without it the status lasts its own
 * time. It has no area (every buff built so far is on self), so the aim overlay draws nothing for
 * it. A status that grows the body (Berserk's `size`) needs room for the grown body where the
 * caster stands, or the cast is refused (`casterBlockedBy`, DEC-382, `INBOX.md` HC-Q113).
 */
export class BuffEffect implements AbilityEffect<BuffSpec> {
  public readonly kind = 'buff';

  /** @param statuses - The statuses a buff may name, with their modifiers (`content/status-effects/`). */
  public constructor(
    private readonly statuses: {
      has(id: string): boolean;
      get(id: string): Pick<AuthoredStatusEffect, 'modifiers'>;
    },
  ) {}

  /** A buff names a known status, and a duration override, when set, of at least one tick. */
  public validate(spec: BuffSpec): readonly string[] {
    return [
      ...(this.statuses.has(spec.statusId) ? [] : [`buff status "${spec.statusId}" is unknown`]),
      ...(spec.durationTicks === undefined
        ? []
        : mustBePositive(spec.durationTicks, 'buff duration')),
    ];
  }

  /** Nothing: a buff on self has no area to draw. */
  public describe(): readonly AbilityDisplayStep[] {
    return [];
  }

  /**
   * `no-room` when the step's status grows the caster's body and the grown body has no room where
   * the caster stands: the room test `BodySizeSystem` grows a body by (`placeWithRoom`). The grown
   * radius is the built radius times the caster's `size` now times the status's own `size`
   * modifiers, so the 1.3 is read from the status. `null` when the status does not grow the body,
   * when the caster holds it already (a recast refreshes it, and the body does not grow again),
   * and without walls. A refused cast spends nothing, so the meter stays full.
   */
  public casterBlockedBy(
    spec: BuffSpec,
    casterId: EntityId,
    state: GameState,
  ): AbilityRejectReason | null {
    const growth = this.growthOf(spec.statusId);
    const caster = state.entities.get(casterId);
    const transform = caster?.findComponent(Transform);
    const statuses = caster?.findComponent(StatusEffects);
    if (
      growth <= 1 ||
      state.collisions === null ||
      transform === undefined ||
      statuses === undefined ||
      statuses.active.some(({ definition }) => definition.id === spec.statusId)
    ) {
      return null;
    }
    const radius = (transform.radius / transform.scale) * statuses.multiplier('size') * growth;
    return placeWithRoom(state.collisions, transform.position, radius) === null ? 'no-room' : null;
  }

  /** Applies the step's status to the caster. */
  public apply(spec: BuffSpec, cast: CastContext): void {
    cast.statuses.apply(
      cast.state,
      cast.casterId,
      spec.statusId,
      cast.casterId,
      spec.durationTicks,
    );
  }

  /** How many times one application of `statusId` scales the body: (1 + its `add`s) × its `mul`s on `size`. */
  private growthOf(statusId: string): number {
    let product = 1;
    let bonus = 0;
    for (const { stat, op, value } of this.statuses.get(statusId).modifiers) {
      if (stat !== 'size') continue;
      if (op === 'add') bonus += value;
      else product *= value;
    }
    return (1 + bonus) * product;
  }
}
