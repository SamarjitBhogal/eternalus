import { createDefaultGameConfig } from '@eternalus/core';
import { describe, expect, it } from 'vitest';

import { prepareMatchWorld } from './prepareMatchWorld';
import { seatedConfig, strongholdOf } from './seatedConfig';

const CONFIG = createDefaultGameConfig();
const { map } = prepareMatchWorld(CONFIG, 1);

const positionOf = (team: 'light' | 'dark') =>
  map.features.find((feature) => feature.kind === 'stronghold' && feature.team === team)?.position;

describe('strongholdOf', () => {
  it.each(['light', 'dark'] as const)("is the %s team's stronghold position", (team) => {
    expect(positionOf(team)).toBeDefined();
    expect(strongholdOf(map, team)).toEqual(positionOf(team));
  });

  it('throws naming the map and the team when there is no stronghold for it', () => {
    const withoutDark = { ...map, features: map.features.filter((f) => f.team !== 'dark') };
    expect(() => strongholdOf(withoutDark, 'dark')).toThrow(
      `Map "${map.id}" has no dark stronghold to spawn the player at.`,
    );
  });
});

describe('seatedConfig', () => {
  it("sets the player's team and a seat at its stronghold, as a new config", () => {
    const seated = seatedConfig(CONFIG, map, { legend: 'sentinel', team: 'dark' });

    expect(seated.match.playerTeam).toBe('dark');
    expect(seated.match.seat).toEqual({ definitionId: 'sentinel', at: positionOf('dark') });
    expect(seated.map).toBe(CONFIG.map);
    expect(CONFIG.match.seat).toBeNull();
    expect(CONFIG.match.playerTeam).toBe('light');
  });

  it('throws the stronghold error before returning a config', () => {
    const bare = { ...map, features: [] };
    expect(() => seatedConfig(CONFIG, bare, { legend: 'warrior', team: 'light' })).toThrow(
      'has no light stronghold',
    );
  });
});
