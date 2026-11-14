import type { EntityId, InputIntent, PlayableTeam, Snapshot } from '@eternalus/core';

/**
 * The part of core's `Simulation` a Duel needs, as a server-side port (ADR 0016 point 1): the
 * match host tests against a fake, and one adapter (`CoreDuelSimulation`) wraps the real one.
 */
export interface DuelSimulation {
  /** The seed the match's map was generated from, sent in `match-found`. */
  readonly seed: number;
  /** Advances one tick; applies the commands `enqueueIntent` queued. */
  step(): void;
  /**
   * Turns `intent` of the player on `team` into commands for that seat's Legend (the actor is
   * stamped here, never taken from the client, ADR 0016 point 1), applied at the next step.
   */
  enqueueIntent(team: PlayableTeam, intent: InputIntent): void;
  /** The state after the last step. */
  snapshot(): Snapshot;
  /** The Legend the player on `team` controls. */
  legendOf(team: PlayableTeam): EntityId;
  /** Whether a verdict ended the match. */
  isOver(): boolean;
  /** The winning team once over; `null` for a draw or while it runs. */
  winner(): PlayableTeam | null;
}

/** Builds a fresh `DuelSimulation` for each pair of players. */
export interface DuelSimulationFactory {
  /** Throws when the match cannot be built; the host then closes both connections. */
  create(): DuelSimulation;
}
