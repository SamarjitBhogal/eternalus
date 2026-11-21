import { describe, expect, it } from 'vitest';

import { Capturable } from './Capturable';

describe('Capturable', () => {
  it('starts neutral, empty and unlocked', () => {
    const zone = new Capturable();

    expect(zone.owner).toBe('neutral');
    expect(zone.progress).toBe(0);
    expect(zone.checkpoint).toBe(0);
    expect(zone.progressTeam).toBe('neutral');
    expect(zone.lockedBy).toBeNull();
    expect(zone.lockingProgress).toBe(0);
  });

  it('leans Light above zero and Dark below zero', () => {
    const zone = new Capturable();

    zone.setProgress(0.4, 1);
    expect(zone.progressTeam).toBe('light');
    expect(zone.checkpoint).toBe(1);

    zone.setProgress(-0.7, 2);
    expect(zone.progressTeam).toBe('dark');
    expect(zone.progress).toBe(-0.7);
  });

  it('changes owner and reports the previous one; the locking state follows the owner', () => {
    const zone = new Capturable();

    expect(zone.setOwner('dark')).toBe('neutral');
    expect(zone.owner).toBe('dark');
    expect(zone.lockingProgress).toBe(-1);
    expect(zone.setOwner('light')).toBe('dark');
    expect(zone.lockingProgress).toBe(1);
  });

  it('keeps the presence it is given, empty at first', () => {
    const zone = new Capturable();
    expect(zone.presence).toEqual({ light: 0, dark: 0, neutral: 0 });

    zone.setPresence({ light: 3, dark: 1, neutral: 0 });
    expect(zone.presence).toEqual({ light: 3, dark: 1, neutral: 0 });
  });

  it("keeps each side's highest reached checkpoint until the owner changes (DEC-145 (g))", () => {
    const zone = new Capturable();

    zone.markReached('light', 2);
    zone.markReached('light', 1);
    zone.markReached('dark', 1);
    expect([zone.reachedBy('light'), zone.reachedBy('dark'), zone.reachedBy('neutral')]).toEqual([
      2, 1, 0,
    ]);

    zone.setOwner('light');
    expect([zone.reachedBy('light'), zone.reachedBy('dark')]).toEqual([0, 0]);
  });

  it('maps every team to its locking progress', () => {
    expect(Capturable.lockingProgressOf('light')).toBe(1);
    expect(Capturable.lockingProgressOf('dark')).toBe(-1);
    expect(Capturable.lockingProgressOf('neutral')).toBe(0);
  });
});
