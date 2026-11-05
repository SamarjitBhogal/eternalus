import type { BotRosterDefinition } from '@eternalus/core';

import type { PlayableTeam } from '../../bridge/domain.types';
import type { LegendClassCard } from '../../bridge/catalogue.types';
import type { MatchSetupDraft, RosterEntry } from '../../bridge/events';
import { isSelectableClass } from '../../bridge/selectionRules';
import type { Rng } from './Rng.types';

/** A bot's name: its class and its place in the team ("Sentinel 5"). */
export function botDisplayName(card: Pick<LegendClassCard, 'displayName'>, index: number): string {
  return `${card.displayName} ${String(index + 1)}`;
}

/**
 * Builds a match setup from content (reference 14 §5 "rosters are data"): the player's team is
 * drawn from the match seed's stream; each team is its Rover (index 0) and the bot roster's lane
 * bots in roster order (DEC-61, DEC-102). The allies' Rover is the player, the enemies' a bot. Both
 * Rovers carry the first lane bot's class as a placeholder, and every bot has no Legend, until
 * LOCK IN fills them (`fillRosters`, DEC-61).
 * @throws Error when the roster's lane bots plus the Rover do not make `legendsPerTeam`, or a lane
 *   bot's class has no selectable card in the catalogue (DEC-48: a locked card never goes to a bot).
 */
export function buildMatchSetup(inputs: {
  readonly seed: number;
  readonly rng: Rng;
  readonly legendClasses: readonly LegendClassCard[];
  readonly botRoster: BotRosterDefinition;
  readonly legendsPerTeam: number;
  readonly playerName: string;
}): MatchSetupDraft {
  const { seed, rng, legendClasses, botRoster, legendsPerTeam, playerName } = inputs;
  if (botRoster.laners.length !== legendsPerTeam - 1) {
    throw new Error(
      `buildMatchSetup: the bot roster has ${String(botRoster.laners.length)} lane bots; a team of ${String(legendsPerTeam)} needs ${String(legendsPerTeam - 1)} and its Rover`,
    );
  }
  const laners = botRoster.laners.map((classId) => {
    const card = legendClasses.find((candidate) => candidate.classId === classId);
    if (card === undefined || !isSelectableClass(card)) {
      throw new Error(`buildMatchSetup: the bot roster names "${classId}", not a selectable class`);
    }
    return card;
  });
  const [placeholder] = laners;
  if (placeholder === undefined)
    throw new Error('buildMatchSetup: the bot roster has no lane bots');
  const roster = (team: PlayableTeam, hasPlayer: boolean): RosterEntry[] =>
    [placeholder, ...laners].map((card, index) => {
      const isPlayer = hasPlayer && index === 0;
      return {
        legendId: `${team}-${String(index + 1)}`,
        displayName: isPlayer ? playerName : botDisplayName(card, index),
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
