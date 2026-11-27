import { describe, expect, it } from 'vitest';

import { BossPhase } from './BossPhase';

describe('BossPhase', () => {
  it('starts healthy at tick 0, with no hit', () => {
    const phase = new BossPhase();

    expect(phase.phase).toBe('healthy');
    expect(phase.changedTick).toBe(0);
    expect(phase.wasHitSinceChange).toBe(false);
    expect(phase.fields).toEqual(['healthy', 0, -1]);
  });

  it('enters a phase on a tick, and counts only a hit on or after that tick', () => {
    const phase = new BossPhase();
    phase.recordHit(30);
    phase.enter('hurt', 40);

    expect(phase.phase).toBe('hurt');
    expect(phase.changedTick).toBe(40);
    expect(phase.wasHitSinceChange).toBe(false);

    phase.recordHit(40);

    expect(phase.wasHitSinceChange).toBe(true);
    expect(phase.fields).toEqual(['hurt', 40, 40]);
  });
});
