import { describe, expect, it } from 'vitest';

import { STRINGS } from './strings';

const { characterSelect, hud } = STRINGS;

describe('STRINGS.characterSelect templates', () => {
  it('counts allies in the singular and plural (72:865)', () => {
    expect(characterSelect.allyCount(1)).toBe('1 Ally');
    expect(characterSelect.allyCount(2)).toBe('2 Allies');
    expect(characterSelect.allyCount(0)).toBe('0 Allies');
  });

  it('builds the breadcrumb, the role line and the team labels', () => {
    expect(characterSelect.legendBreadcrumb('Magus')).toBe('Magus > Choose Your Legend');
    expect(characterSelect.detailLine('Oracle', 'Support')).toBe('Oracle  ·  Support');
    expect(characterSelect.rosterLabel('Dark')).toBe('Dark team');
    expect(characterSelect.teamBadge('Light')).toBe('You are on the Light team');
  });

  it('names a roster tile with its class once known', () => {
    expect(characterSelect.allyTile(characterSelect.you, 'Magus')).toBe('You, Magus');
    expect(characterSelect.allyTile(characterSelect.you, null)).toBe('You');
  });
});

describe('STRINGS.hud templates', () => {
  it('describes meters and the level badge', () => {
    expect(hud.meterValue(1850, 2220)).toBe('1850 of 2220');
    expect(hud.levelValue(42, 70)).toBe('Level 42, 70% to the next');
  });

  it('names slots with or without an ability name', () => {
    expect(hud.slot('Ability 1', null, hud.ready)).toBe('Ability 1, ready');
    expect(hud.slot('Gadget 1', 'Courage', hud.notReady)).toBe('Gadget 1: Courage, not ready');
  });

  it('names structures and objectives with their holder', () => {
    expect(hud.structure('Wall', hud.noDataLabel)).toBe('Wall, No data yet');
    expect(hud.objective('A', 'Capture Point', hud.allegiance.ours)).toBe(
      'Capture Point A, held by your team',
    );
  });
});

describe('STRINGS team-name templates', () => {
  it('names the winner and each stronghold from a team name (content)', () => {
    expect(STRINGS.results.winner('Lux')).toBe('Lux wins.');
    expect(STRINGS.viewport.explorer.legend.stronghold('Umbra')).toBe('Umbra stronghold');
  });
});

describe('STRINGS.settings templates', () => {
  it('words a binding conflict and a reset', () => {
    expect(STRINGS.settings.conflict('Esc', 'Pause menu')).toBe(
      'Esc is already bound to Pause menu.',
    );
    expect(STRINGS.settings.resetLabel('Sprint')).toBe('Reset Sprint to default');
  });
});
