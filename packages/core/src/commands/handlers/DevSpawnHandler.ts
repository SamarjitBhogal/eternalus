import { Legend } from '../../entities/Legend';
import { Unit } from '../../entities/Unit';
import type { Command, CommandRejectReason } from '../Command.types';
import type { CommandContext, CommandHandler } from '../CommandHandler.types';

/**
 * Developer menu: spawns `count` entities of a registered kind through the `EntityFactory`, so
 * cheats are ordinary, replayable commands that respect the per-team caps of `config.limits`.
 * A lane minion exists only in its horde (architecture 18 §3.5, MS-25), so it is refused here
 * (`horde-only`); `dev-spawn-mobs` spawns one.
 */
export class DevSpawnHandler implements CommandHandler<'dev-spawn'> {
  /** Spawns the entities and announces each with `entity-spawned`. */
  public handle(
    command: Command<'dev-spawn'>,
    { state, factory }: CommandContext,
  ): CommandRejectReason | null {
    const { kind, definitionId, team, at, count } = command;
    const EntityClass = factory.registry.get(kind);
    if (EntityClass === undefined) {
      return 'unknown-kind';
    }
    if (!factory.canCreate(kind, definitionId)) {
      return 'unknown-definition';
    }
    const definition = factory.definitions.get(definitionId);
    if ('controller' in definition && definition.controller === 'minion') {
      return 'horde-only';
    }
    if (!Number.isInteger(count) || count < 1) {
      return 'invalid-count';
    }
    if (!Number.isFinite(at.x) || !Number.isFinite(at.y)) {
      return 'invalid-position';
    }
    const { maxUnitsPerTeam, maxLegendsPerTeam } = state.config.limits;
    const isUnit = EntityClass.prototype instanceof Unit;
    const isLegend = EntityClass.prototype instanceof Legend;
    if (
      (isUnit && state.entities.countOnTeam(team, Unit) + count > maxUnitsPerTeam) ||
      (isLegend && state.entities.countOnTeam(team, Legend) + count > maxLegendsPerTeam)
    ) {
      return 'cap-exceeded';
    }
    // TODO(sholtzman): hand spawns to SpawnSystem (03 §8 deferral) once it exists.
    for (let spawned = 0; spawned < count; spawned += 1) {
      const entity = factory.create(kind, definitionId, { team, position: at });
      state.entities.add(entity);
      state.events.emit('entity-spawned', { entityId: entity.id, kind, team });
    }
    return null;
  }
}
