import type { PlayableTeam } from '@eternalus/core';
import { DEFAULT_DEVIATION, DEFAULT_RATING, DEFAULT_VOLATILITY } from './Glicko2.constants';
import { Glicko2 } from './Glicko2';
import type { PlayerRecord } from './PlayerRatings.types';

const NEW_PLAYER: PlayerRecord = {
  rating: DEFAULT_RATING,
  deviation: DEFAULT_DEVIATION,
  volatility: DEFAULT_VOLATILITY,
  wins: 0,
  losses: 0,
  streak: 0,
  matches: 0,
};

/**
 * Every player's rating and record, by guest id (SCRUM-431, DEC-36). In memory: a server restart
 * forgets them. Each match is its own Glicko-2 rating period for both players.
 */
export class PlayerRatings {
  private readonly records = new Map<string, PlayerRecord>();

  private readonly glicko = new Glicko2();

  /** The record of `guestId`; a player with no finished match has the starting rating. */
  public get(guestId: string): PlayerRecord {
    return this.records.get(guestId) ?? NEW_PLAYER;
  }

  /** Forgets `guestId` (the guest is gone for good), so the map does not grow without limit. */
  public forget(guestId: string): void {
    this.records.delete(guestId);
  }

  /** Updates both players after a match; `winner` is the winning seat, or `null` for a draw. */
  public recordMatch(light: string, dark: string, winner: PlayableTeam | null): void {
    const [before, after] = [this.get(light), this.get(dark)];
    const lightScore = winner === null ? 0.5 : winner === 'light' ? 1 : 0;
    this.records.set(light, this.next(before, after, lightScore));
    this.records.set(dark, this.next(after, before, 1 - lightScore));
  }

  private next(player: PlayerRecord, opponent: PlayerRecord, score: number): PlayerRecord {
    const isWin = score === 1;
    const isLoss = score === 0;
    const streak = isWin
      ? Math.max(player.streak, 0) + 1
      : isLoss
        ? Math.min(player.streak, 0) - 1
        : 0;
    return {
      ...this.glicko.update(player, [{ opponent, score }]),
      wins: player.wins + (isWin ? 1 : 0),
      losses: player.losses + (isLoss ? 1 : 0),
      streak,
      matches: player.matches + 1,
    };
  }
}
