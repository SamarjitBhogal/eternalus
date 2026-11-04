import { describe, expect, it } from 'vitest';

import { BOT_DIFFICULTIES } from '../ai/difficulties/botDifficulties';
import { BOT_ROSTER } from '../teams/botRoster';
import { BotRosterDifficultyRule } from './BotRosterDifficultyRule';

const rule = new BotRosterDifficultyRule(BOT_DIFFICULTIES);

describe('BotRosterDifficultyRule', () => {
  it('accepts the shipped roster: both roles name a loaded difficulty (DEC-149)', () => {
    expect(rule.check(BOT_ROSTER)).toEqual([]);
  });

  it('flags a role whose difficulty id is unknown, by role', () => {
    const roster = { ...BOT_ROSTER, difficulties: { laner: 'normal', rover: 'nightmare' } };

    expect(rule.check(roster)).toEqual(['rover difficulty "nightmare" is not a bot difficulty']);
  });

  it('does not take an inherited object key for a difficulty id', () => {
    const roster = { ...BOT_ROSTER, difficulties: { laner: 'toString', rover: 'rover' } };

    expect(rule.check(roster)).toEqual(['laner difficulty "toString" is not a bot difficulty']);
  });
});
