import { describe, expect, it } from 'vitest';

import { ContentValidationError } from '../ContentValidationError';
import { loadSpawnWaves } from './loadSpawnWaves';
import { SPAWN_WAVES } from './spawnWaves';

const LIGHT_WAVE = {
  mobId: 'light-minion',
  weightClass: 'light',
  firstAtSeconds: 200,
  everySeconds: 60,
  lane: 'own-lane',
} as const;

describe('loadSpawnWaves', () => {
  it('converts the first wave and the interval from seconds to ticks at load', () => {
    const loaded = loadSpawnWaves(30);

    expect(loaded['spawner-tower']).toEqual([
      {
        mobId: 'light-minion',
        weightClass: 'light',
        lane: 'own-lane',
        firstAtTicks: 6000,
        everyTicks: 1800,
      },
    ]);
    expect(loaded['buff-tower']?.[0]).toMatchObject({ firstAtTicks: 6900, everyTicks: 1800 });
    expect(loaded.stronghold?.[0]).toMatchObject({ firstAtTicks: 5400, everyTicks: 2700 });
    expect(loadSpawnWaves(10).stronghold?.[0]).toMatchObject({
      firstAtTicks: 1800,
      everyTicks: 900,
    });
    expect(Object.keys(loaded)).toEqual(Object.keys(SPAWN_WAVES));
  });

  it('rounds to the nearest tick and keeps a first wave at 0 s at 0 ticks', () => {
    const loaded = loadSpawnWaves(30, {
      'spawner-tower': [{ ...LIGHT_WAVE, firstAtSeconds: 0, everySeconds: 0.51 }],
    });

    expect(loaded['spawner-tower']?.[0]).toMatchObject({ firstAtTicks: 0, everyTicks: 15 });
  });

  it('rejects a wave that repeats more often than once a tick or starts before the countdown ends', () => {
    const broken = {
      'spawner-tower': [{ ...LIGHT_WAVE, everySeconds: 0.01 }],
      'buff-tower': [{ ...LIGHT_WAVE, firstAtSeconds: -1 }],
    };

    expect(() => loadSpawnWaves(30, broken)).toThrow(ContentValidationError);
    expect(() => loadSpawnWaves(30, broken)).toThrow(
      /spawner-tower wave repeats every 0\.01 s; buff-tower wave starts -1 s after the countdown/,
    );
  });
});
