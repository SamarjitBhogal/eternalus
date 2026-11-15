import type { TimelineAction } from '../../config/MatchTimelineEntry.types';
import type { DirectorContext } from '../DirectorContext.types';
import type { TimelineActionHandler } from '../TimelineActionRegistry.types';

/**
 * `summon-greater-boss`: the Cathedral gem erupts (architecture 12 §3, DEC-83), which emits
 * `greater-boss-summoned`. Spawns no boss yet: the boss's spawn is a later change.
 */
export class SummonGreaterBossAction implements TimelineActionHandler<'summon-greater-boss'> {
  /** Erupts the gem for `action.bossId`, once per match (`MatchRecord.eruptGem`). */
  public run(action: TimelineAction<'summon-greater-boss'>, context: DirectorContext): void {
    context.state.match.eruptGem(action.bossId);
  }
}
