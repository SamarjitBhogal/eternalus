import {
  type EntityId,
  type InputIntent,
  type MapObject,
  type PlayableTeam,
  type Simulation,
  type Snapshot,
} from '@eternalus/core';
import type { DuelSimulation } from './DuelSimulation.types';
import { SeatCommands } from './SeatCommands';

/**
 * The `DuelSimulation` over core's `Simulation` with one human slot per team (ADR 0016 point 1).
 * It keeps the last snapshot, so one `snapshot()` per tick serves the seats' targeting and the
 * broadcast. The verdict comes from core's `match-ended` event, whose winner is a team, not the
 * playerTeam-relative `victory` or `defeat` phase.
 */
export class CoreDuelSimulation implements DuelSimulation {
  private readonly legends: Readonly<Record<PlayableTeam, EntityId>>;
  private readonly seats: Readonly<Record<PlayableTeam, SeatCommands>>;
  private latest: Snapshot;
  private verdictWinner: PlayableTeam | null = null;
  private over = false;

  /** @throws Error when a seat's Legend did not spawn. */
  public constructor(
    private readonly simulation: Simulation,
    mapObjects: readonly MapObject[],
    public readonly seed: number,
  ) {
    this.legends = {
      light: CoreDuelSimulation.legendOrThrow(simulation, 'light'),
      dark: CoreDuelSimulation.legendOrThrow(simulation, 'dark'),
    };
    const seat = (team: PlayableTeam): SeatCommands =>
      new SeatCommands(this.legends[team], mapObjects, (command) => {
        simulation.enqueueCommand(command);
      });
    this.seats = { light: seat('light'), dark: seat('dark') };
    this.latest = simulation.snapshot();
    simulation.on('match-ended', ({ result }) => {
      this.over = true;
      this.verdictWinner = result.winner;
    });
  }

  public step(): void {
    this.simulation.step();
    this.latest = this.simulation.snapshot();
  }

  public enqueueIntent(team: PlayableTeam, intent: InputIntent): void {
    this.seats[team].apply(intent, this.latest);
  }

  public snapshot(): Snapshot {
    return this.latest;
  }

  public legendOf(team: PlayableTeam): EntityId {
    return this.legends[team];
  }

  public isOver(): boolean {
    return this.over;
  }

  public winner(): PlayableTeam | null {
    return this.verdictWinner;
  }

  private static legendOrThrow(simulation: Simulation, team: PlayableTeam): EntityId {
    const legend = simulation.humanLegendIdOf(team);
    if (legend === null) throw new Error(`The ${team} seat's Legend did not spawn.`);
    return legend;
  }
}
