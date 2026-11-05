import { createDefaultGameConfig } from '@eternalus/core';
import { describe, expect, it } from 'vitest';

import { seatedConfig } from './seatedConfig';

const CONFIG = createDefaultGameConfig();

describe('seatedConfig', () => {
  it("sets the player's team and a seat for its Legend, as a new config", () => {
    const seated = seatedConfig(CONFIG, { legend: 'sentinel', team: 'dark' });

    expect(seated.match.playerTeam).toBe('dark');
    expect(seated.match.seat).toEqual({ definitionId: 'sentinel' });
    expect(seated.map).toBe(CONFIG.map);
    expect(CONFIG.match.seat).toBeNull();
    expect(CONFIG.match.playerTeam).toBe('light');
  });
});
