import { describe, expect, it } from 'vitest';

import { TeamMembership } from './TeamMembership';

describe('TeamMembership', () => {
  it('treats the same team as allies and other teams as enemies', () => {
    const light = new TeamMembership('light');
    const otherLight = new TeamMembership('light');
    const dark = new TeamMembership('dark');

    expect(light.isAlly(otherLight)).toBe(true);
    expect(light.isEnemy(dark)).toBe(true);
  });

  it('makes neutral units enemies of both playable teams', () => {
    const boss = new TeamMembership('neutral');

    expect(boss.isEnemy(new TeamMembership('light'))).toBe(true);
    expect(boss.isEnemy(new TeamMembership('dark'))).toBe(true);
  });

  it('changes team and returns the previous one', () => {
    const revived = new TeamMembership('dark');

    expect(revived.setTeam('light')).toBe('dark');
    expect(revived.team).toBe('light');
  });
});
