/** Where a match is in its timeline (architecture 12 §2). */
export type MatchPhase =
  'countdown' | 'early-game' | 'quarter-mark' | 'mid-game' | 'end-game' | 'victory' | 'defeat';

/**
 * A command the simulation applied, with the tick it was applied on. Typed structurally because
 * `state/` may not import `commands/` (architecture 03 §4); every `Command` fits it.
 */
export type RecordedCommand = {
  readonly tick: number;
  readonly command: { readonly type: string };
};

/**
 * One playable team's match counters (architecture 03 §2). `unitsSuppressed` counts the members
 * the unit cap kept out of a horde (architecture 18 §3.4), `unitsRequested` every member asked for.
 */
export type TeamState = {
  readonly unitsRequested: number;
  readonly unitsSuppressed: number;
  /**
   * Lane towers this team has lost on each lane (by `MapLane.id`; 18 MS-16): its minions carry one
   * `enraged` stack per loss, and each loss moves the enemy's base-stat point toward it (DISC-24).
   */
  readonly towersLostByLane: Readonly<Record<string, number>>;
};
