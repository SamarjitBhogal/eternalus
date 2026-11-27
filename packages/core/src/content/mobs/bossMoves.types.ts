/** Effects available to a boss's authored special moves. */
export type BossMoveEffect = 'line' | 'stun-line' | 'shield' | 'pull-area';

/** One authored special. Durations are in seconds and distances are in world units. */
export type BossMoveDefinition = {
  readonly id: string;
  readonly effect: BossMoveEffect;
  readonly charge: number;
  readonly active: number;
  readonly recovery: number;
  readonly range: number;
  readonly width: number;
  readonly damage: number;
  readonly sweep: number;
};
