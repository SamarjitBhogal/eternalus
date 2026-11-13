import type { MatchEndReason } from '@eternalus/protocol';
import type { PlayableTeam } from '@eternalus/core';

/** What one bot saw and did; `DuelBot` fills it, `BotChecks` and `BotSummary` read it. */
export type BotReport = {
  readonly name: string;
  isWaiting: boolean;
  matchId: string | null;
  seed: number | null;
  team: PlayableTeam | null;
  legendId: string | null;
  states: number;
  lastTick: number;
  ticksOutOfOrder: number;
  firstMoveTick: number | null;
  attackTicks: number;
  /** The enemy Legend's first and lowest health seen; `null` until it is seen. */
  enemyHealthFirst: number | null;
  enemyHealthLow: number | null;
  ownHealthFirst: number | null;
  ownHealthLow: number | null;
  /** The enemy Legend was seen at 0 health, or this bot's team won. */
  /** The enemy Legend died: seen at 0 HP, or gone from the snapshot after it was seen. */
  hasKilled: boolean;
  /** This bot's Legend died: seen at 0 HP, or gone from the snapshot after it was seen. */
  hasDied: boolean;
  ended: { readonly reason: MatchEndReason; readonly winner: PlayableTeam | null } | null;
  readonly rejected: string[];
  error: string | null;
};
