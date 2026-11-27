import { LegendSpawner } from '../../entities/LegendSpawner';
import type { ControllerSpawn } from '../../entities/EntityFactory.types';
import { Legend } from '../../entities/Legend';
import { Unit } from '../../entities/Unit';
import type { Command, CommandRejectReason } from '../Command.types';
import type { CommandContext, CommandHandler } from '../CommandHandler.types';

/**
 * Developer menu: adds one bot Legend of a class at its team's Stronghold (architecture 13 §4,
 * FR-097), through the same `LegendSpawner` as the roster. It plays with the controller it is
 * given (the Rover's: no lane). Refused when the definition is not a Legend, the map has no
 * Stronghold for the team, or the team is at `maxLegendsPerTeam` (or the Unit cap, as `dev-spawn`
 * counts it).
 */
export class DevSpawnLegendHandler implements CommandHandler<'dev-spawn-legend'> {
  /** @param controller - The bot controller, difficulty and memory the Legend starts with. */
  public constructor(private readonly controller: ControllerSpawn) {}

  /** Validates the class, the Stronghold and the caps, then spawns the Legend and announces it. */
  public handle(
    { team, definitionId }: Command<'dev-spawn-legend'>,
    { state, factory }: CommandContext,
  ): CommandRejectReason | null {
    const legends = new LegendSpawner(factory);
    const refusal = legends.refusal(definitionId);
    if (refusal !== null) {
      return refusal;
    }
    const position = state.world?.strongholdOf(team);
    if (position === undefined) {
      return 'no-stronghold';
    }
    const { maxUnitsPerTeam, maxLegendsPerTeam } = state.config.limits;
    if (
      state.entities.countOnTeam(team, Legend) >= maxLegendsPerTeam ||
      state.entities.countOnTeam(team, Unit) >= maxUnitsPerTeam
    ) {
      return 'cap-exceeded';
    }
    legends.spawn(state, definitionId, team, position, this.controller);
    return null;
  }
}
