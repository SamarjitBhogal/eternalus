import { describe, expect, it } from 'vitest';

import { LEGEND_CLASSES } from '../legends/legendCatalogue';
import { BOT_ROSTER } from '../teams/botRoster';
import { BotRosterClassRule } from './BotRosterClassRule';

const rule = new BotRosterClassRule(LEGEND_CLASSES);

describe('BotRosterClassRule', () => {
  it('accepts the shipped roster: every laner plays a loaded class', () => {
    expect(rule.check(BOT_ROSTER)).toEqual([]);
  });

  it('flags a locked or unknown class once each (DEC-48: a locked card never goes to a bot)', () => {
    const roster = { ...BOT_ROSTER, laners: ['magus', 'harbinger', 'harbinger', 'flying'] };

    expect(rule.check(roster)).toEqual([
      'laner class "harbinger" is not a playable Legend class',
      'laner class "flying" is not a playable Legend class',
    ]);
  });
});
