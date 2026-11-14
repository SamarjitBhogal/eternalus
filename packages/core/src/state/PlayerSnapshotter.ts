import { AbilityRuntime } from '../components/AbilityRuntime';
import { Health } from '../components/Health';
import { Aether } from '../components/Aether';
import { StatusEffects } from '../components/StatusEffects';
import { abilityBlockReason } from '../abilities/abilityBlockReason';
import { MAGUS_RESOURCES } from '../content/abilities/magusKit';
import type { Entity } from '../entities/Entity';
import type { Snapshot } from './Snapshot.types';

/** Projects only the human's ability runtime, keeping shared entity groups in EntitySnapshotter. */
export class PlayerSnapshotter {
  /** Converts authored seconds to the match's fixed tick rate. */
  public constructor(private readonly tickRate: number) {}
  /** No invented slots for classes without an implemented kit. */
  public snapshotOf(entity: Entity | undefined, tick: number): Snapshot['player'] {
    const runtime = entity?.findComponent(AbilityRuntime);
    if (entity === undefined || runtime === undefined) return undefined;
    return {
      entityId: entity.id,
      slots: runtime.kit.map((ability) => {
        const blockedBy = abilityBlockReason(
          ability,
          runtime,
          tick,
          entity.findComponent(Aether)?.current ?? 0,
          entity.findComponent(Health)?.isDead !== false,
          entity.findComponent(StatusEffects)?.has('cannot-cast') === true,
        );
        return {
          slot: ability.slot,
          abilityId: ability.id,
          cooldownRemainingTicks: Math.max(0, runtime.readyAt(ability.slot) - tick),
          cooldownTicks: Math.round(ability.cooldownSeconds * this.tickRate),
          charge:
            ability.slot === 'ability-4' ? runtime.charge / MAGUS_RESOURCES.ultimateMax : null,
          isReady: blockedBy === null,
          blockedBy,
          lastCastTick: runtime.lastCast?.id === ability.id ? runtime.lastCast.tick : null,
        };
      }),
    };
  }
}
