import type { PlayableTeam } from '../../bridge/domain.types';
import type { LegendClassCard, MatchSetupDraft, RosterEntry } from '../../bridge/events';
import type { Rng } from './Rng.types';

/**
 * Builds a match setup from content (reference 14 §5 "rosters are data"): the player's team is
 * drawn from the match seed's stream; the allies are the player as their team's Rover plus bots,
 * the enemies are all bots led by the enemy Rover. Bots take the classes in catalogue order.
 */
export function buildMatchSetup(inputs: {
  readonly seed: number;
  readonly rng: Rng;
  readonly legendClasses: readonly LegendClassCard[];
  readonly legendsPerTeam: number;
  readonly playerName: string;
}): MatchSetupDraft {
  const { seed, rng, legendClasses, legendsPerTeam, playerName } = inputs;
  const classAt = (index: number): LegendClassCard => {
    const card = legendClasses[index % legendClasses.length];
    if (card === undefined) throw new Error('buildMatchSetup: the catalogue has no Legend classes');
    return card;
  };
  const roster = (team: PlayableTeam, hasPlayer: boolean): RosterEntry[] =>
    Array.from({ length: legendsPerTeam }, (_, index) => {
      const card = classAt(index);
      const isPlayer = hasPlayer && index === 0;
      return {
        legendId: `${team}-${String(index + 1)}`,
        displayName: isPlayer ? playerName : `${card.displayName} ${String(index + 1)}`,
        // The player's class is a placeholder; matchSetup.selection holds their pick.
        classId: card.classId,
        specId: null,
        isBot: !isPlayer,
        isPlayer,
        isRover: index === 0,
        team,
      };
    });
  const playerTeam: PlayableTeam = rng.nextInt(2) === 0 ? 'light' : 'dark';
  const enemyTeam: PlayableTeam = playerTeam === 'light' ? 'dark' : 'light';
  return { seed, playerTeam, allies: roster(playerTeam, true), enemies: roster(enemyTeam, false) };
}
