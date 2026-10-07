import { TeamMembership } from '../../components/TeamMembership';
import type { FeatureOwner } from '../../content/maps/maps.types';
import { Legend } from '../../entities/Legend';
import { Unit } from '../../entities/Unit';
import type { GameState } from '../../state/GameState';
import type { Command, CommandRejectReason } from '../Command.types';
import type { CommandContext, CommandHandler } from '../CommandHandler.types';

/**
 * Developer menu: spawns `count` entities of a registered kind through the `EntityFactory`, so
 * cheats are ordinary, replayable commands that respect the per-team caps of `config.limits`.
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
      (isUnit && DevSpawnHandler.countOnTeam(state, team, Unit) + count > maxUnitsPerTeam) ||
      (isLegend && DevSpawnHandler.countOnTeam(state, team, Legend) + count > maxLegendsPerTeam)
    ) {
      return 'cap-exceeded';
    }
    // TODO(sholtzman): hand spawns to SpawnSystem (03 §8 deferral) once session C adds it.
    for (let spawned = 0; spawned < count; spawned += 1) {
      const entity = factory.create(kind, definitionId, { team, position: at });
      state.entities.add(entity);
      state.events.emit('entity-spawned', { entityId: entity.id, kind, team });
    }
    return null;
  }

  /** How many live entities of `family` fight for `team`. */
  private static countOnTeam(state: GameState, team: FeatureOwner, family: typeof Unit): number {
    let total = 0;
    state.entities.forEach((entity) => {
      if (entity instanceof family && entity.findComponent(TeamMembership)?.team === team) {
        total += 1;
      }
    });
    return total;
  }
}
