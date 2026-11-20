import type { EntityId, InputIntent, PlayableTeam, Snapshot } from '@eternalus/core';
import type { DuelSimulation } from './DuelSimulation.types';

const EMPTY_TEAM = { unitsRequested: 0, unitsSuppressed: 0, towersLostByLane: {} };

/** A `DuelSimulation` for tests: counts steps, records intents and ends when a test says so. */
export class FakeDuelSimulation implements DuelSimulation {
  public readonly seed = 7;

  /** Steps taken so far. */
  public steps = 0;
  /** Every intent queued, oldest first. */
  public readonly intents: { readonly team: PlayableTeam; readonly intent: InputIntent }[] = [];
  /** Set by a test to end the match with this winner. */
  public result: { readonly winner: PlayableTeam | null } | null = null;
  /** Set by a test to make the next step throw. */
  public failOnStep = false;

  public step(): void {
    if (this.failOnStep) throw new Error('fake step failure');
    this.steps += 1;
  }

  public enqueueIntent(team: PlayableTeam, intent: InputIntent): void {
    this.intents.push({ team, intent });
  }

  public snapshot(): Snapshot {
    return {
      tick: this.steps,
      match: { phase: 'countdown', phaseEnteredTick: 0, upcoming: [], humanLegendId: null },
      entities: [],
      hordes: [],
      teams: { light: EMPTY_TEAM, dark: EMPTY_TEAM },
      player: null,
    };
  }

  public legendOf(team: PlayableTeam): EntityId {
    return team === 'light' ? 'legend-light' : 'legend-dark';
  }

  public isOver(): boolean {
    return this.result !== null;
  }

  public winner(): PlayableTeam | null {
    return this.result?.winner ?? null;
  }
}
