import { AbilityRuntime } from '../../components/AbilityRuntime';
import { Health } from '../../components/Health';
import type { Command, CommandRejectReason } from '../Command.types';
import type { CommandContext, CommandHandler } from '../CommandHandler.types';

/** Validates the cast boundary; the ability system pays resources and runs effects once. */
export class CastAbilityHandler implements CommandHandler<'cast-ability'> {
  /** Rejects unknown actors, invalid aim and slots outside the equipped kit. */
  public handle(
    { actorId, slot, aim }: Command<'cast-ability'>,
    { state }: CommandContext,
  ): CommandRejectReason | null {
    const actor = state.entities.get(actorId);
    if (actor === undefined) return 'unknown-entity';
    if (!Number.isFinite(aim.point.x) || !Number.isFinite(aim.point.y)) return 'invalid-position';
    const runtime = actor.findComponent(AbilityRuntime);
    if (runtime?.kit.some((ability) => ability.slot === slot) !== true) return 'not-supported';
    if (actor.findComponent(Health)?.isDead !== false) return 'cannot-attack';
    runtime.request({ slot, point: aim.point });
    return null;
  }
}
