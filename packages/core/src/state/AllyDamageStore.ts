import type { PlayableTeam } from '../teams/teams.types';

/**
 * Each playable team's ally damage per lane since that team's last Stronghold heavy wave (DEC-89,
 * architecture 18 §3.3): the damage its Legends and mobs took, on the lane nearest each victim.
 * Changed only through `add` and `clear`.
 */
export class AllyDamageStore {
  private readonly tallies: Readonly<Record<PlayableTeam, Map<string, number>>> = {
    light: new Map(),
    dark: new Map(),
  };

  /** How many team and lane tallies hold damage. */
  public get size(): number {
    return this.tallies.light.size + this.tallies.dark.size;
  }

  /** Adds `amount` to `team`'s tally on `lane`; nothing for an amount of 0 or less. */
  public add(team: PlayableTeam, lane: string, amount: number): void {
    if (amount <= 0) {
      return;
    }
    const tally = this.tallies[team];
    tally.set(lane, (tally.get(lane) ?? 0) + amount);
  }

  /** `lane`'s share (0 to 1) of all the ally damage `team` has taken; 0 when it has taken none. */
  public share(team: PlayableTeam, lane: string): number {
    const tally = this.tallies[team];
    let total = 0;
    tally.forEach((amount) => {
      total += amount;
    });
    return total === 0 ? 0 : (tally.get(lane) ?? 0) / total;
  }

  /** Forgets `team`'s tallies: its next window starts now. */
  public clear(team: PlayableTeam): void {
    this.tallies[team].clear();
  }

  /** Every tally that holds damage, Light's first, each team's in the order its lanes were first hit. */
  public forEach(visit: (team: PlayableTeam, lane: string, amount: number) => void): void {
    for (const team of ['light', 'dark'] as const) {
      this.tallies[team].forEach((amount, lane) => {
        visit(team, lane, amount);
      });
    }
  }
}
