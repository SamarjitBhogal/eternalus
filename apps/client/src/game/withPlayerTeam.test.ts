import { createDefaultGameConfig } from '@eternalus/core';
import { describe, expect, it } from 'vitest';

import { withPlayerTeam } from './withPlayerTeam';

const CONFIG = createDefaultGameConfig();

describe('withPlayerTeam', () => {
  it("sets the player's team, as a new config, and nothing else", () => {
    const played = withPlayerTeam(CONFIG, 'dark');

    expect(played.match.playerTeam).toBe('dark');
    expect(played).toEqual({ ...CONFIG, match: { ...CONFIG.match, playerTeam: 'dark' } });
    expect(played.map).toBe(CONFIG.map);
    expect(CONFIG.match.playerTeam).toBe('light');
  });
});
