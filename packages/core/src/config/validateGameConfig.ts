import { ConfigValidationError } from './ConfigValidationError';
import {
  MAX_LEGENDS_PER_TEAM,
  MAX_UNITS_PER_TEAM,
  SUPPORTED_TICK_RATE,
} from './GameConfig.constants';
import type { GameConfig } from './GameConfig.types';

type Rule = {
  readonly path: string;
  readonly rule: string;
  readonly isValid: (value: unknown, config: Readonly<Record<string, unknown>>) => boolean;
};

const isRecord = (value: unknown): value is Readonly<Record<string, unknown>> =>
  typeof value === 'object' && value !== null;

const isWhole = (value: unknown, min: number, max = Infinity): value is number =>
  typeof value === 'number' && Number.isInteger(value) && value >= min && value <= max;

const isPositive = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value) && value > 0;

const valueAt = (root: unknown, path: string): unknown =>
  path.split('.').reduce((node, key) => (isRecord(node) ? node[key] : undefined), root);

const count = (path: string): Rule => ({
  path,
  rule: 'must be a whole number >= 0',
  isValid: (value) => isWhole(value, 0),
});

const positive = (path: string): Rule => ({
  path,
  rule: 'must be a finite number > 0',
  isValid: isPositive,
});

/** Checked in order; cross-field rules come after the fields they read. */
const RULES: readonly Rule[] = [
  {
    path: 'tickRate',
    rule: `must be ${String(SUPPORTED_TICK_RATE)} (D9: the simulation runs at a fixed rate)`,
    isValid: (value) => value === SUPPORTED_TICK_RATE,
  },
  {
    path: 'limits.maxLegendsPerTeam',
    rule: `must be a whole number from 1 to ${String(MAX_LEGENDS_PER_TEAM)}`,
    isValid: (value) => isWhole(value, 1, MAX_LEGENDS_PER_TEAM),
  },
  {
    path: 'limits.maxUnitsPerTeam',
    rule: `must be a whole number from 1 to ${String(MAX_UNITS_PER_TEAM)}`,
    isValid: (value) => isWhole(value, 1, MAX_UNITS_PER_TEAM),
  },
  {
    path: 'map.numLanes',
    rule: 'must be an odd whole number >= 1 (the Cathedral needs a middle lane)',
    isValid: (value) => isWhole(value, 1) && value % 2 === 1,
  },
  count('map.spawnTowersPerLane'),
  count('map.buffTowersPerLane'),
  count('map.campsPerSide'),
  count('map.cornerCamps'),
  {
    path: 'map.cornerCamps',
    rule: 'must be even (corner camps are mirrored)',
    isValid: (value) => isWhole(value, 0) && value % 2 === 0,
  },
  {
    path: 'map.campsPerSide',
    rule: 'must be 0 with one lane (camps sit between lanes)',
    isValid: (value, config) => valueAt(config, 'map.numLanes') !== 1 || value === 0,
  },
  positive('map.worldWidth'),
  positive('map.worldHeight'),
  positive('map.navCellSize'),
  {
    path: 'map.presetId',
    rule: 'must be a non-empty string when set',
    isValid: (value) => value === undefined || (typeof value === 'string' && value !== ''),
  },
  {
    path: 'match.legendsPerTeam',
    rule: 'must be a whole number from 1 to limits.maxLegendsPerTeam',
    isValid: (value, config) =>
      isWhole(value, 1, valueAt(config, 'limits.maxLegendsPerTeam') as number),
  },
  count('match.legendsPerLane'),
  {
    path: 'match.countdownSeconds',
    rule: 'must be a finite number >= 0',
    isValid: (value) => value === 0 || isPositive(value),
  },
  count('match.hordeSizes.light'),
  count('match.hordeSizes.medium'),
  count('match.hordeSizes.heavy'),
  count('match.initialHordesPerTeam'),
  positive('match.plannedMatchSeconds'),
  {
    path: 'limits.maxUnitsPerTeam',
    rule: 'must fit the initial hordes (match.initialHordesPerTeam * match.hordeSizes.light)',
    isValid: (value, config) =>
      // Safe: all three fields passed their own rules above.
      (value as number) >=
      (valueAt(config, 'match.initialHordesPerTeam') as number) *
        (valueAt(config, 'match.hordeSizes.light') as number),
  },
];

/**
 * Checks an untrusted value against every `GameConfig` rule and returns it typed. Throws a
 * `ConfigValidationError` naming the first offending field and its rule.
 */
export const validateGameConfig = (config: unknown): GameConfig => {
  if (!isRecord(config)) {
    throw new ConfigValidationError('config', 'must be an object');
  }
  for (const { path, rule, isValid } of RULES) {
    if (!isValid(valueAt(config, path), config)) {
      throw new ConfigValidationError(path, rule);
    }
  }
  // Safe: every field of GameConfig was checked above.
  return config as GameConfig;
};
