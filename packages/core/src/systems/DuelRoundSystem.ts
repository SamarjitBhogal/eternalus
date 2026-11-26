import type { StatusEffectApplier } from '../combat/StatusEffectApplier';
import { Health } from '../components/Health';
import { StatusEffects } from '../components/StatusEffects';
import { opponentOf, PLAYABLE_TEAMS } from '../teams/playableTeams';
import type { PlayableTeam } from '../teams/teams.types';
import type { Vec2 } from '../utils/geometry.types';
import { LegendReset } from './LegendReset';
import type { System, SystemContext } from './System.types';

/**
 * A Duel's round rule (DEC-36): when a seat's Legend dies, the other team scores a kill and both
 * Legends return to their start points at full health at once, with no respawn timer, through the
 * shared `LegendReset`. The reset also drops every status effect, the attack target, any dash or
 * knock-back under way and the steps of a cast still to come (Fury's dash after its wind-up), so a
 * damage over time cannot kill a Legend the tick after and a push cannot slide it off its start
 * point. Each status ends first through the match's `StatusEffectApplier`, oldest first, so each
 * one emits `status-expired` and an ability it granted leaves the `granted` slot with it (Fury's
 * dash). It runs before `DeathSystem`, so the dead Legend is healed before it would be removed.
 */
export class DuelRoundSystem implements System {
  public readonly name = 'duel-round';

  private readonly reset = new LegendReset();

  /**
   * @param starts - Where each team's Legend starts and returns to.
   * @param statuses - The match's one status applier; it ends the reset Legends' statuses.
   */
  public constructor(
    private readonly starts: Readonly<Record<PlayableTeam, Vec2>>,
    private readonly statuses: StatusEffectApplier,
  ) {}

  /** Scores this tick's fallen Legends, then resets both seats if anyone fell. */
  public update({ state }: SystemContext): void {
    const seats = PLAYABLE_TEAMS.flatMap((team) => {
      const id = state.match.humanLegendIdOf(team);
      const legend = id === null ? undefined : state.entities.get(id);
      return legend === undefined ? [] : [{ team, legend }];
    });
    const fallen = seats.filter(({ legend }) => legend.findComponent(Health)?.isDead === true);
    for (const { team } of fallen) {
      state.match.recordDuelKill(opponentOf(team));
    }
    if (fallen.length === 0) {
      return;
    }
    for (const { team, legend } of seats) {
      // Ids first: each removal changes the list.
      const ids = (legend.findComponent(StatusEffects)?.active ?? []).map(
        ({ definition }) => definition.id,
      );
      for (const statusId of ids) {
        this.statuses.remove(state, legend.id, statusId);
      }
      this.reset.apply(legend, this.starts[team]);
    }
  }
}
