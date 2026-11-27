import type { EntityId, Snapshot, Team } from '@eternalus/core';

import type { VisibilityRule } from './views/EntityLayer.types';

/**
 * Who watches the match on this screen: the player's Legend and its team, the side whose units are
 * allies here. `null` player is sim mode (no human plays). The rules that depend on the viewer read
 * it: `HealthBarVisibility` (which bars are allies') and `visibilityOf` (what a hidden unit shows).
 */
export class Viewer {
  private side: Team | null = null;

  /**
   * @param playerId - The player's Legend: the snapshot's human, or in an online Duel the Legend
   *   the server named (`match.humanLegendId` is only the `playerTeam` seat there, ADR 0016).
   */
  public constructor(public readonly playerId: EntityId | null) {}

  /**
   * The player's team, from the first snapshot that has the player; kept after the player dies
   * (a dead player is no longer in the snapshot, and its team never changes). `null` until then.
   */
  public get team(): Team | null {
    return this.side;
  }

  /** Reads the player's team from `snapshot` until it is known. Call it with every snapshot. */
  public observe(snapshot: Snapshot): void {
    this.side ??= snapshot.entities.find(({ id }) => id === this.playerId)?.team ?? null;
  }

  /**
   * How `entity` is drawn (DEC-266): a hidden (Veiled) unit of the viewer's team is `faded`, every
   * other hidden unit `hidden` (not drawn at all), including while the player's team is not known
   * yet, so nothing leaks. In sim mode every hidden unit is `faded`.
   */
  public readonly visibilityOf: VisibilityRule = (entity) => {
    if (entity.isHidden !== true) {
      return 'shown';
    }
    const isOwnSide = this.side !== null && entity.team === this.side;
    return this.playerId === null || isOwnSide ? 'faded' : 'hidden';
  };
}
