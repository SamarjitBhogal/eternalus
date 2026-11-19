import { Abilities } from '../components/Abilities';
import type { AbilitySlotRuntime } from '../components/AbilitySlotRuntime';
import { Health } from '../components/Health';
import { StatusEffects } from '../components/StatusEffects';
import type { ContentCatalogue } from '../content/ContentCatalogue';
import type {
  StatusEffectDefinition,
  StatusExpireSpec,
} from '../content/status-effects/statusEffects.types';
import type { EntityId } from '../state/EntityStore.types';
import type { GameState } from '../state/GameState';

/**
 * The one way a status reaches or leaves an entity (architecture 05 section 8): abilities, weapons,
 * projectiles and structures call `apply`, auras and holds call `remove`, `StatusEffectSystem`
 * calls `expire`. It emits every `status-applied` and `status-expired`, and fills the holder's
 * `granted` slot with a status's `grants` ability while the status lasts (Fury's dash, DEC-270),
 * so the slot changes in the same call as the status. When the status whose ability the slot holds
 * ends, the slot takes the ability of the last status still active (oldest first) that grants
 * one, or empties, unless the ended status's `onExpire` lands a grant (`expire`).
 * `DefaultSystemPipeline` builds the match's one instance and hands it to the systems that need it.
 */
export class StatusEffectApplier {
  /** @param statuses - The loaded status effects (`loadStatusEffects`). */
  public constructor(private readonly statuses: ContentCatalogue<StatusEffectDefinition>) {}

  /**
   * Applies status `statusId` to `targetId`, credited to `sourceId`. Returns whether it landed: a
   * missing or dead target, or one without `StatusEffects` (a structure), is immune, and so is a
   * `control-immune` target to hard control.
   *
   * @param durationTicks - The source's own duration for this application (a debuff step's
   *   `durationTicks`); the status's own duration when omitted.
   * @throws UnknownDefinitionError when no status has the id `statusId`.
   * @throws Error when `durationTicks` is given and is not a positive whole number of ticks.
   */
  public apply(
    state: GameState,
    targetId: EntityId,
    statusId: string,
    sourceId: EntityId | null,
    durationTicks?: number,
  ): boolean {
    if (durationTicks !== undefined && !(Number.isInteger(durationTicks) && durationTicks > 0)) {
      throw new Error(
        `A status duration must be a positive whole tick count, got ${String(durationTicks)}.`,
      );
    }
    const definition = this.statuses.get(statusId);
    const target = state.entities.get(targetId);
    const statuses = target?.findComponent(StatusEffects);
    if (
      target === undefined ||
      statuses === undefined ||
      target.findComponent(Health)?.isDead === true ||
      (definition.controlClass === 'hard' && statuses.has('control-immune'))
    ) {
      return false;
    }
    statuses.apply(definition, sourceId, state.tick, durationTicks);
    if (definition.grants !== undefined) {
      target.findComponent(Abilities)?.slot('granted')?.hold(definition.grants);
    }
    state.events.emit('status-applied', { entityId: targetId, statusId, sourceId });
    return true;
  }

  /**
   * Ends status `statusId` on `targetId` now (an aura left, a hold released) and emits
   * `status-expired`. Returns whether it was active.
   */
  public remove(state: GameState, targetId: EntityId, statusId: string): boolean {
    const target = state.entities.get(targetId);
    const statuses = target?.findComponent(StatusEffects);
    const active = statuses?.active.find((status) => status.definition.id === statusId);
    if (target === undefined || statuses === undefined || active === undefined) {
      return false;
    }
    const { sourceId, definition } = active;
    const slot = target.findComponent(Abilities)?.slot('granted');
    statuses.remove(statusId);
    if (StatusEffectApplier.holdsGrantOf(slot, definition)) {
      StatusEffectApplier.regrant(slot, statuses);
    }
    state.events.emit('status-expired', { entityId: targetId, statusId, sourceId });
    return true;
  }

  /**
   * Removes every status on `targetId` that is over at `state.tick`, emitting `status-expired` for
   * each, oldest first, then runs their `onExpire` (stun → `control-immune`), credited to the same
   * source. When the slot held the grant of a status that ended, it takes the grant of the last
   * status still active only if no follow-up landed a grant of its own.
   */
  public expire(state: GameState, targetId: EntityId): void {
    const target = state.entities.get(targetId);
    const statuses = target?.findComponent(StatusEffects);
    if (target === undefined || statuses === undefined) {
      return;
    }
    const slot = target.findComponent(Abilities)?.slot('granted');
    let hasGrantEnded = false;
    // Allocated only when a status with an onExpire times out, never per tick (NFR-023).
    let followUps: [StatusExpireSpec, EntityId | null][] | undefined;
    for (const status of statuses.active) {
      if (status.hasExpired(state.tick)) {
        state.events.emit('status-expired', {
          entityId: targetId,
          statusId: status.definition.id,
          sourceId: status.sourceId,
        });
        hasGrantEnded ||= StatusEffectApplier.holdsGrantOf(slot, status.definition);
        for (const spec of status.definition.onExpire) {
          (followUps ??= []).push([spec, status.sourceId]);
        }
      }
    }
    statuses.expire(state.tick);
    // A follow-up that lands a grant fills the slot itself, later than the expiry: the slot then
    // never passes through another ability on the way, which would end its cooldown (`hold`).
    let isRegrantDue = hasGrantEnded;
    if (followUps !== undefined) {
      for (const [spec, sourceId] of followUps) {
        if (
          this.apply(state, targetId, spec.statusId, sourceId) &&
          this.statuses.get(spec.statusId).grants !== undefined
        ) {
          isRegrantDue = false;
        }
      }
    }
    if (isRegrantDue) {
      StatusEffectApplier.regrant(slot, statuses);
    }
  }

  /** Whether `slot` (the holder's `granted` slot) holds the ability `definition` grants. */
  private static holdsGrantOf(
    slot: AbilitySlotRuntime | undefined,
    definition: StatusEffectDefinition,
  ): boolean {
    return definition.grants !== undefined && slot?.abilityId === definition.grants;
  }

  /**
   * Fills `slot` from `statuses` once the status whose ability it held has left them: the grant of
   * the last active status (oldest first) that has one, or nothing.
   */
  private static regrant(slot: AbilitySlotRuntime | undefined, statuses: StatusEffects): void {
    const granting = statuses.active.findLast(({ definition }) => definition.grants !== undefined);
    slot?.hold(granting?.definition.grants ?? null);
  }
}
