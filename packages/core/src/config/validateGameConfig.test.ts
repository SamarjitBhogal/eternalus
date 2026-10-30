import { describe, expect, it } from 'vitest';

import { ConfigValidationError } from './ConfigValidationError';
import { createDefaultGameConfig } from './defaultGameConfig';
import type { DeepPartial, GameConfig } from './GameConfig.types';
import { validateGameConfig } from './validateGameConfig';

const failurePath = (overrides: DeepPartial<GameConfig>): string | null => {
  try {
    validateGameConfig(createDefaultGameConfig(overrides));
    return null;
  } catch (error) {
    if (error instanceof ConfigValidationError) {
      return error.path;
    }
    throw error;
  }
};

const withoutKey = (record: object, key: string): object =>
  Object.fromEntries(Object.entries(record).filter(([name]) => name !== key));

describe('validateGameConfig', () => {
  it('accepts the default config and returns it unchanged', () => {
    const config = createDefaultGameConfig();
    expect(validateGameConfig(config)).toBe(config);
  });

  it('accepts a unit cap that exactly fits the initial hordes', () => {
    expect(failurePath({ limits: { maxUnitsPerTeam: 48 } })).toBeNull();
  });

  it('accepts a five-lane map with two spawner towers per lane', () => {
    expect(failurePath({ map: { numLanes: 5, spawnTowersPerLane: 2 } })).toBeNull();
  });

  it('names the field and the rule in the error', () => {
    expect(() => validateGameConfig(createDefaultGameConfig({ map: { numLanes: 0 } }))).toThrow(
      'Invalid game config: map.numLanes must be an odd whole number >= 1',
    );
  });

  it.each([null, 7, 'config', undefined])('rejects a non-object config (%s)', (config) => {
    expect(() => validateGameConfig(config)).toThrow(
      new ConfigValidationError('config', 'must be an object'),
    );
  });

  it.each<[string, DeepPartial<GameConfig>]>([
    ['tickRate', { tickRate: 60 }],
    ['limits.maxLegendsPerTeam', { limits: { maxLegendsPerTeam: 11 } }],
    ['limits.maxLegendsPerTeam', { limits: { maxLegendsPerTeam: 0 } }],
    ['limits.maxUnitsPerTeam', { limits: { maxUnitsPerTeam: 145 } }],
    ['limits.maxUnitsPerTeam', { limits: { maxUnitsPerTeam: 1.5 } }],
    ['map.numLanes', { map: { numLanes: 0 } }],
    ['map.numLanes', { map: { numLanes: 4 } }],
    ['map.numLanes', { map: { numLanes: 2.5 } }],
    ['map.spawnTowersPerLane', { map: { spawnTowersPerLane: -1 } }],
    ['map.buffTowersPerLane', { map: { buffTowersPerLane: 0.5 } }],
    ['map.campsPerSide', { map: { campsPerSide: -2 } }],
    ['map.cornerCamps', { map: { cornerCamps: -2 } }],
    ['map.cornerCamps', { map: { cornerCamps: 3 } }],
    ['map.campsPerSide', { map: { numLanes: 1, campsPerSide: 2 } }],
    ['map.worldWidth', { map: { worldWidth: 0 } }],
    ['map.worldHeight', { map: { worldHeight: Infinity } }],
    ['map.navCellSize', { map: { navCellSize: -5 } }],
    ['map.flowFieldCorridorHalfWidth', { map: { flowFieldCorridorHalfWidth: 0 } }],
    ['map.flowFieldCellBudget', { map: { flowFieldCellBudget: 0 } }],
    ['map.flowFieldCellBudget', { map: { flowFieldCellBudget: 12.5 } }],
    ['map.presetId', { map: { presetId: '' } }],
    ['match.legendsPerTeam', { match: { legendsPerTeam: 0 } }],
    ['match.legendsPerTeam', { limits: { maxLegendsPerTeam: 5 } }],
    ['match.legendsPerLane', { match: { legendsPerLane: -1 } }],
    ['match.countdownSeconds', { match: { countdownSeconds: -1 } }],
    ['match.hordeSizes.light', { match: { hordeSizes: { light: -16 } } }],
    ['match.hordeSizes.medium', { match: { hordeSizes: { medium: 0.5 } } }],
    ['match.hordeSizes.heavy', { match: { hordeSizes: { heavy: Number.NaN } } }],
    ['match.initialHordesPerTeam', { match: { initialHordesPerTeam: -3 } }],
    ['match.plannedMatchSeconds', { match: { plannedMatchSeconds: 0 } }],
    ['limits.maxUnitsPerTeam', { limits: { maxUnitsPerTeam: 47 } }],
    ['limits.maxUnitsPerTeam', { match: { initialHordesPerTeam: 10 } }],
  ])('rejects a bad %s', (path, overrides) => {
    expect(failurePath(overrides)).toBe(path);
  });

  it('accepts one lane without camps, no corner camps, no countdown and no preset', () => {
    const config = createDefaultGameConfig({
      map: { numLanes: 1, campsPerSide: 0, cornerCamps: 0 },
      match: { countdownSeconds: 0 },
    });
    const mapWithoutPreset = withoutKey(config.map, 'presetId');
    expect(validateGameConfig({ ...config, map: mapWithoutPreset }).map.presetId).toBeUndefined();
  });

  it('rejects a config with a missing section', () => {
    expect(() => validateGameConfig(withoutKey(createDefaultGameConfig(), 'match'))).toThrow(
      new ConfigValidationError(
        'match.legendsPerTeam',
        'must be a whole number from 1 to limits.maxLegendsPerTeam',
      ),
    );
  });
});
