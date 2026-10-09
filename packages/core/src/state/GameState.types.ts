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
