import type { TimelineAction } from '../../config/MatchTimelineEntry.types';
import type { DirectorContext } from '../DirectorContext.types';
import type { TimelineActionHandler } from '../TimelineActionRegistry.types';

/**
 * `summon-greater-boss`: the Cathedral gem erupts (architecture 12 §3, DEC-83), which emits
 * `greater-boss-summoned`, on which `SpawnSystem` spawns the Greater Boss through the Cathedral's
 * guard plan (07's Implementation status). Not in a Duel, whose world round the arena is off
 * (DEC-36): there the gem stays and no boss comes.
 */
export class SummonGreaterBossAction implements TimelineActionHandler<'summon-greater-boss'> {
  /**
   * Erupts the gem for `action.bossId`, once per match (`MatchRecord.eruptGem`), outside a Duel.
   */
  public run(action: TimelineAction<'summon-greater-boss'>, context: DirectorContext): void {
    if (context.state.match.duel !== null) return;
    context.state.match.eruptGem(action.bossId);
  }
}
