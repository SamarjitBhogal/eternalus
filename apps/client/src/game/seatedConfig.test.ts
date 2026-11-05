import { createDefaultGameConfig } from '@eternalus/core';
import { describe, expect, it } from 'vitest';

import { seatedConfig } from './seatedConfig';

const CONFIG = createDefaultGameConfig();

describe('seatedConfig', () => {
  it("sets the player's team, as a new config, and nothing else", () => {
    const seated = seatedConfig(CONFIG, { team: 'dark' });

    expect(seated.match.playerTeam).toBe('dark');
    expect(seated).toEqual({ ...CONFIG, match: { ...CONFIG.match, playerTeam: 'dark' } });
    expect(seated.map).toBe(CONFIG.map);
    expect(CONFIG.match.playerTeam).toBe('light');
  });
});
