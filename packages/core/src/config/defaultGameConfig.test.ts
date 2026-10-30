import { describe, expect, it } from 'vitest';

import { createDefaultGameConfig } from './defaultGameConfig';

describe('createDefaultGameConfig', () => {
  it('returns the MVP defaults of the integration contract', () => {
    const config = createDefaultGameConfig();
    expect(config.tickRate).toBe(30);
    expect(config.map).toMatchObject({
      numLanes: 3,
      spawnTowersPerLane: 1,
      buffTowersPerLane: 1,
      campsPerSide: 6,
      cornerCamps: 4,
    });
    expect(config.match.hordeSizes).toEqual({ light: 16, medium: 8, heavy: 4 });
    expect(config.limits).toEqual({ maxLegendsPerTeam: 10, maxUnitsPerTeam: 144 });
  });

  it('plans a 30-minute match with a 10 s countdown (DEC-13, DEC-84)', () => {
    const { match } = createDefaultGameConfig();
    expect(match.plannedMatchSeconds).toBe(1800);
    expect(match.countdownSeconds).toBe(10);
  });

  it('plays for the light team unless the setup says otherwise (12 §4)', () => {
    expect(createDefaultGameConfig().match.playerTeam).toBe('light');
    expect(createDefaultGameConfig({ match: { playerTeam: 'dark' } }).match.playerTeam).toBe(
      'dark',
    );
  });

  it('builds the default timeline: the countdown end in ticks, then three fractions (12 §3)', () => {
    expect(createDefaultGameConfig().match.timeline).toEqual([
      {
        id: 'countdown-over',
        at: { atTick: 300 },
        action: { kind: 'enter-phase', phase: 'early-game' },
      },
      {
        id: 'quarter-mark',
        at: { atFraction: 0.25 },
        action: { kind: 'enter-phase', phase: 'quarter-mark' },
      },
      {
        id: 'mid-game',
        at: { atFraction: 0.5 },
        action: { kind: 'enter-phase', phase: 'mid-game' },
      },
      {
        id: 'end-game',
        at: { atFraction: 0.75 },
        action: { kind: 'enter-phase', phase: 'end-game' },
      },
    ]);
  });

  it('ends the default countdown at an overridden countdownSeconds', () => {
    const [countdownOver] = createDefaultGameConfig({ match: { countdownSeconds: 2.5 } }).match
      .timeline;
    expect(countdownOver?.at).toEqual({ atTick: 75 });
  });

  it('replaces the whole timeline when it is overridden, never merging entries', () => {
    const timeline = [
      { id: 'only', at: { atTick: 5 }, action: { kind: 'enter-phase', phase: 'end-game' } },
    ] as const;
    expect(createDefaultGameConfig({ match: { timeline } }).match.timeline).toEqual(timeline);
  });

  it('merges overrides at every depth and keeps the other defaults', () => {
    const config = createDefaultGameConfig({
      map: { numLanes: 5 },
      match: { hordeSizes: { heavy: 2 } },
      limits: { maxUnitsPerTeam: 100 },
    });
    expect(config.map.numLanes).toBe(5);
    expect(config.map.campsPerSide).toBe(6);
    expect(config.match.hordeSizes).toEqual({ light: 16, medium: 8, heavy: 2 });
    expect(config.match.legendsPerTeam).toBe(10);
    expect(config.limits).toEqual({ maxLegendsPerTeam: 10, maxUnitsPerTeam: 100 });
  });

  it('returns a deeply frozen config', () => {
    const config = createDefaultGameConfig();
    expect(Object.isFrozen(config)).toBe(true);
    expect(Object.isFrozen(config.map)).toBe(true);
    expect(Object.isFrozen(config.match)).toBe(true);
    expect(Object.isFrozen(config.match.hordeSizes)).toBe(true);
    expect(Object.isFrozen(config.match.timeline)).toBe(true);
    expect(Object.isFrozen(config.match.timeline[0]?.at)).toBe(true);
    expect(Object.isFrozen(config.limits)).toBe(true);
  });

  it('never shares state between calls', () => {
    const first = createDefaultGameConfig({ map: { numLanes: 7 } });
    expect(createDefaultGameConfig().map.numLanes).toBe(3);
    expect(first.map).not.toBe(createDefaultGameConfig().map);
  });
});
