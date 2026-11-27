import { LastLegendHits } from '../components/LastLegendHits';
import type { Progression } from '../components/Progression';
import type {
  LevelCurveDefinition,
  XpSourcesDefinition,
} from '../content/progression/progression.types';
import type { Entity } from '../entities/Entity';
import type { EntityId } from '../state/EntityStore.types';
import type { PlayableTeam, Team } from '../teams/teams.types';
import type { Award, PersonalAward, TeamAward } from './ProgressionSystem.types';

/**
 * `ProgressionSystem`'s boss rewards (`xpSources.teamKills`, balancing.md boss table). A boss kill
 * pays every Legend of its killer's playable team, not the killer: its `xp`, lifting none more
 * than `maxLevels` levels (DEC-237), or a flat `levels` from where each Legend stands inside its
 * level (DEC-371 E8a). The last hitter gets `lastHitterLevels` in all instead (DEC-371 E8b): the
 * killing Legend, or for a last hit by a minion or a tower its team's Legend that hit the boss
 * last (`LastLegendHits`, DEC-416). With no such Legend, every Legend gets `levels` only.
 */
export class TeamKillAwards {
  /** @param rewards - The team-kill rewards by boss definition id (content). */
  public constructor(private readonly rewards: XpSourcesDefinition['teamKills']) {}

  /**
   * The bosses whose kill pays a last hitter. `KillCredit` keeps each team's last Legend hitter on
   * them (DEC-416).
   */
  public static lastHitterBossIds(rewards: XpSourcesDefinition['teamKills']): readonly string[] {
    return Object.entries(rewards)
      .filter(([, reward]) => 'lastHitterLevels' in reward)
      .map(([bossId]) => bossId);
  }

  /** `award` as the Legend `id` takes it: the last hitter's levels for the last hitter. */
  public static shareOf(award: TeamAward, id: EntityId): TeamAward {
    return award.lastHitter?.id === id ? { ...award, levels: award.lastHitter.levels } : award;
  }

  /**
   * The XP a team-wide or owed `award` pays a Legend at `progression`: all of it, or no more than
   * lifts it `levels` levels keeping its share of its level (DEC-371 E8a), or `maxLevels` levels
   * (DEC-237).
   */
  public static cappedXp(
    award: Exclude<Award, PersonalAward>,
    progression: Progression,
    curve: LevelCurveDefinition,
  ): number {
    if (award.levels !== undefined) {
      return Math.min(award.xp, progression.xpToAdvance(award.levels, curve));
    }
    return award.maxLevels === undefined
      ? award.xp
      : Math.min(award.xp, progression.xpToReach(progression.level + award.maxLevels, curve));
  }

  /** Whether the kill of `victim` pays its killer's team instead of its killer. */
  public isTeamKill(victim: Entity): boolean {
    return this.rewards[victim.definitionId] !== undefined;
  }

  /**
   * The award for the kill of `victim`, a boss of `victimTeam`, by `killer` of `team`.
   * Throws for a victim that `isTeamKill` rejects.
   */
  public awardFor(victim: Entity, victimTeam: Team, killer: Entity, team: PlayableTeam): TeamAward {
    const reward = this.rewards[victim.definitionId];
    if (reward === undefined) {
      throw new Error(`"${victim.definitionId}" has no team-kill reward.`);
    }
    const award = { kind: 'team-kill', team, victimId: victim.id, victimTeam } as const;
    if (!('levels' in reward)) {
      return { ...award, xp: reward.xp, maxLevels: reward.maxLevels };
    }
    // The killer comes first: `KillCredit` does not record the hit of a killer that waits to respawn.
    const lastHitterId =
      killer.family === 'legend' ? killer.id : victim.findComponent(LastLegendHits)?.of(team);
    return {
      ...award,
      xp: Number.POSITIVE_INFINITY, // "all the XP it takes": `levels` caps it per Legend
      levels: reward.levels,
      ...(reward.lastHitterLevels !== undefined &&
        lastHitterId !== undefined && {
          lastHitter: { id: lastHitterId, levels: reward.lastHitterLevels },
        }),
    };
  }
}
