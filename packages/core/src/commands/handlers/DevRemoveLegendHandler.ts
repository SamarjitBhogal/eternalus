import { Legend } from '../../entities/Legend';
import type { Command, CommandRejectReason } from '../Command.types';
import type { CommandContext, CommandHandler } from '../CommandHandler.types';
import type { DevRemoveEntityHandler } from './DevRemoveEntityHandler';

/**
 * Developer menu: removes a Legend (13 §4 "Add / remove a Legend", FR-097, DEC-293). Refuses an
 * entity that is not a Legend; the rest is `dev-remove-entity`'s, which refuses the Legend in a
 * human seat (`human-legend`), so the human goes only in sim mode.
 */
export class DevRemoveLegendHandler implements CommandHandler<'dev-remove-legend'> {
  /** @param removeEntity - The removal this handler narrows to Legends. */
  public constructor(private readonly removeEntity: DevRemoveEntityHandler) {}

  /** Checks the entity is a Legend, then removes it as `dev-remove-entity` does. */
  public handle(
    { entityId }: Command<'dev-remove-legend'>,
    context: CommandContext,
  ): CommandRejectReason | null {
    const entity = context.state.entities.get(entityId);
    if (entity === undefined) {
      return 'unknown-entity';
    }
    if (!(entity instanceof Legend)) {
      return 'not-a-legend';
    }
    return this.removeEntity.handle({ type: 'dev-remove-entity', entityId }, context);
  }
}
