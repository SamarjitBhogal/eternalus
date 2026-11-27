import { Combat } from '../../components/Combat';
import { Vision } from '../../components/Vision';
import { Legend } from '../../entities/Legend';
import { Unit } from '../../entities/Unit';
import { Zone } from '../../entities/Zone';
import type { Command, CommandRejectReason } from '../Command.types';
import type { CommandContext, CommandHandler } from '../CommandHandler.types';

/**
 * Developer menu: spawns `count` entities of a registered kind through the `EntityFactory`, so
 * cheats are ordinary, replayable commands that respect the per-team caps of `config.limits`.
 * A lane minion exists only in its horde (architecture 18 §3.5, MS-25), so it is refused here
 * (`horde-only`); `dev-spawn-mobs` spawns one. A zone covers its building's floor, so only the
 * map places it (`map-only`).
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
    if (EntityClass.prototype instanceof Zone) {
      return 'map-only';
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
    // A unit faces the enemy Stronghold until it first moves or attacks (DEC-216 (6)).
    const startFacing = state.world?.startFacing(team, at);
    const isGuard = 'controller' in definition && definition.controller === 'guard';
    if (isGuard && state.world !== null && !state.world.grid.isWalkableAt(at.x, at.y)) {
      return 'invalid-position';
    }
    // TODO(sholtzman): hand spawns to SpawnSystem (03 §8 deferral) once it exists.
    for (let spawned = 0; spawned < count; spawned += 1) {
      const entity = factory.create(kind, definitionId, {
        team,
        position: at,
        ...startFacing,
      });
      state.entities.add(entity);
      if (entity instanceof Unit && isGuard) {
        const index = state.guards.size;
        state.guards.add({
          id: entity.id,
          homeId: entity.id,
          team,
          mobId: definitionId,
          row: 0,
          indexInRow: 0,
          postX: at.x,
          postY: at.y,
          homeX: at.x,
          homeY: at.y,
          homeRadius: 0,
          leashRadius: entity.getComponent(Vision).radius,
          leashTolerance: entity.findComponent(Combat)?.attack.reach ?? 0,
          respawnTicks: 0,
        });
        state.guards.fill(index, entity.id);
      }
      state.events.emit('entity-spawned', { entityId: entity.id, kind, team });
    }
    return null;
  }
}
