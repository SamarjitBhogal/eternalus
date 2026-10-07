import type { Command } from '../Command.types';
import type { CommandContext, CommandHandler } from '../CommandHandler.types';

/**
 * Developer menu: spawns `count` entities of a registered kind through the `EntityFactory`, so
 * cheats are ordinary, replayable commands.
 */
export class DevSpawnHandler implements CommandHandler<'dev-spawn'> {
  /** Spawns the entities and announces each with `entity-spawned`. */
  public handle(
    command: Command<'dev-spawn'>,
    { state, factory }: CommandContext,
  ): 'unknown-kind' | 'invalid-count' | 'invalid-position' | null {
    const { kind, definitionId, team, at, count } = command;
    if (!factory.registry.has(kind)) {
      return 'unknown-kind';
    }
    if (!Number.isInteger(count) || count < 1) {
      return 'invalid-count';
    }
    if (!Number.isFinite(at.x) || !Number.isFinite(at.y)) {
      return 'invalid-position';
    }
    for (let spawned = 0; spawned < count; spawned += 1) {
      const entity = factory.create(kind, definitionId, { team, position: at });
      state.entities.add(entity);
      state.events.emit('entity-spawned', { entityId: entity.id, kind, team });
    }
    return null;
  }
}
