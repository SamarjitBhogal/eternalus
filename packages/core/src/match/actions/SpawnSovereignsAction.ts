import type { TimelineAction } from '../../config/MatchTimelineEntry.types';
import { PLAYABLE_TEAMS } from '../../teams/playableTeams';
import type { DirectorContext } from '../DirectorContext.types';
import type { TimelineActionHandler } from '../TimelineActionRegistry.types';

/** Requests one Sovereign at each Citadel's throne in a standard match. */
export class SpawnSovereignsAction implements TimelineActionHandler<'spawn-sovereigns'> {
  /** Emits the agreed single-unit requests for the next spawn pass. */
  public run(
    { definitionId }: TimelineAction<'spawn-sovereigns'>,
    { state }: DirectorContext,
  ): void {
    if (state.match.duel !== null || state.world === null) return;
    for (const team of PLAYABLE_TEAMS) {
      const position = state.world.throneOf(team);
      if (position !== undefined) {
        state.events.emit('spawn-requested', { team, definitionId, position });
      }
    }
  }
}
