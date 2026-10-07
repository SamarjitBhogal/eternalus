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
    // TODO(sholtzman): hand removal to DeathSystem (03 §4, the only emitter) once session C adds it.
    state.entities.remove(entityId, 'dev-removed');
    state.events.emit('entity-removed', { entityId, cause: 'dev-removed' });
    return null;
  }
}
