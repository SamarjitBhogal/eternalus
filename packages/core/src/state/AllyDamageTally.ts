import { Transform } from '../components/Transform';
import { isPlayableTeam, opponentOf } from '../teams/playableTeams';
import type { EntityStore } from './EntityStore';
import type { GameEvents } from './GameEvents';
import type { GameEventMap } from './GameEvents.types';
import type { AllyDamageStore } from './AllyDamageStore';
import type { MatchWorld } from './MatchWorld';

/**
 * Feeds an `AllyDamageStore` from `damage-applied` events (DEC-89, architecture 18 §3.3): decides
 * which hits count and on which lane, so `GameState` holds only the data. Only a hit on a playable
 * team's Legend or mob counts, from the victim's enemy team: not one with no attacker, or from a
 * neutral (forest camp), removed or same-team attacker; nor any hit in a match without a map. The
 * lane is the one nearest the victim.
 */
export class AllyDamageTally {
  /**
   * Subscribes to `events`; lives as long as the match.
   *
   * @param events - The channel `damage-applied` arrives on.
   * @param entities - Where victims and attackers are looked up.
   * @param world - The map whose routes name the nearest lane, or `null` (nothing counts).
   * @param store - The tally to add to.
   */
  public constructor(
    events: GameEvents,
    private readonly entities: EntityStore,
    private readonly world: MatchWorld | null,
    private readonly store: AllyDamageStore,
  ) {
    events.on('damage-applied', (hit) => {
      this.count(hit);
    });
  }

  private count({ targetId, amount, source }: GameEventMap['damage-applied']): void {
    const victim = this.entities.get(targetId);
    const team = this.entities.teamOf(targetId);
    const position = victim?.findComponent(Transform)?.position;
    if (
      (victim?.family !== 'legend' && victim?.family !== 'mob') ||
      !isPlayableTeam(team) ||
      source.attackerId === null ||
      this.entities.teamOf(source.attackerId) !== opponentOf(team) ||
      position === undefined
    ) {
      return;
    }
    const lane = this.world?.routes.nearestLane(position);
    if (lane !== undefined) {
      this.store.add(team, lane.id, amount);
    }
  }
}
