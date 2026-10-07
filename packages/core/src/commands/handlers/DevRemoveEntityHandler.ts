import type { Command } from '../Command.types';
import type { CommandContext, CommandHandler } from '../CommandHandler.types';

/** Developer menu: removes an entity with the cause `dev-removed`. */
export class DevRemoveEntityHandler implements CommandHandler<'dev-remove-entity'> {
  /** Removes the entity and announces it with `entity-removed`. */
  public handle(
    { entityId }: Command<'dev-remove-entity'>,
    { state }: CommandContext,
  ): 'unknown-entity' | null {
    if (!state.entities.has(entityId)) {
      return 'unknown-entity';
    }
    state.entities.remove(entityId, 'dev-removed');
    state.events.emit('entity-removed', { entityId, cause: 'dev-removed' });
    return null;
  }
}
