import { ConfigValidationError } from './ConfigValidationError';
import {
  MAX_LEGENDS_PER_TEAM,
  MAX_UNITS_PER_TEAM,
  SUPPORTED_TICK_RATE,
} from './GameConfig.constants';
import type { GameConfig } from './GameConfig.types';
import { MATCH_PHASES, TERMINAL_MATCH_PHASES } from './matchPhases';
import type { MatchTimelineEntry, TimelineActionKind } from './MatchTimelineEntry.types';
import { timelineMarkTick } from './timelineMarkTick';

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

const isFraction = (value: unknown): boolean =>
  typeof value === 'number' && value >= 0 && value <= 1;

/** A timeline mark: exactly one of `atTick` (a whole number >= 0) or `atFraction` (0 to 1). */
const isMark = (at: unknown): boolean =>
  isRecord(at) &&
  Object.keys(at).length === 1 &&
  (isWhole(at.atTick, 0) || isFraction(at.atFraction));

/** Each timeline action kind's field check: the registry a new kind adds its line to. */
const ACTION_RULES: Readonly<
  Record<TimelineActionKind, (action: Readonly<Record<string, unknown>>) => boolean>
> = {
  'enter-phase': (action) => MATCH_PHASES.some((phase) => phase === action.phase),
};

const isKnownAction = (action: unknown): boolean =>
  isRecord(action) &&
  typeof action.kind === 'string' &&
  Object.hasOwn(ACTION_RULES, action.kind) &&
  // Safe: `hasOwn` just found the kind among ACTION_RULES' keys.
  ACTION_RULES[action.kind as TimelineActionKind](action);

/** The timeline's entries as records; only for rules after the one that checks its shape. */
const entriesOf = (timeline: unknown): readonly Readonly<Record<string, unknown>>[] =>
  // Safe: the `match.timeline` shape rule passed before any rule that calls this.
  timeline as readonly Readonly<Record<string, unknown>>[];

/**
 * The timeline typed; only for rules after the ones that check every mark and action. Every
 * action is `enter-phase` today, so those rules read every entry as one; a new kind makes them
 * filter by kind first.
 */
const timelineOf = (config: unknown): readonly MatchTimelineEntry[] =>
  // Safe: every mark and every action passed their rules before any rule that calls this.
  valueAt(config, 'match.timeline') as readonly MatchTimelineEntry[];

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
    path: 'match.playerTeam',
    rule: "must be a playable team: 'light' or 'dark'",
    isValid: (value) => value === 'light' || value === 'dark',
  },
  {
    path: 'match.seat',
    rule: 'must be null or { definitionId: a non-empty string, at: a point }',
    isValid: (value) =>
      value === null ||
      (isRecord(value) &&
        typeof value.definitionId === 'string' &&
        value.definitionId !== '' &&
        isRecord(value.at)),
  },
  {
    path: 'match.seat',
    rule: 'its point must be a finite point inside the world (map.worldWidth x map.worldHeight)',
    isValid: (value, config) => {
      if (value === null) {
        return true;
      }
      // Safe: the shape rule above passed, and the map sizes passed their own rules.
      const { x, y } = (value as { readonly at: Readonly<Record<string, unknown>> }).at;
      const width = valueAt(config, 'map.worldWidth') as number;
      const height = valueAt(config, 'map.worldHeight') as number;
      // NaN and Infinity fail the range comparisons, so they need no check of their own.
      return (
        typeof x === 'number' &&
        typeof y === 'number' &&
        x >= 0 &&
        x <= width &&
        y >= 0 &&
        y <= height
      );
    },
  },
  {
    path: 'match.countdownSeconds',
    rule: 'must not exceed match.plannedMatchSeconds (the countdown is part of the planned match)',
    isValid: (value, config) =>
      // Safe: both fields passed their own rules above.
      (value as number) <= (valueAt(config, 'match.plannedMatchSeconds') as number),
  },
  {
    path: 'match.timeline',
    rule: 'must be an array of entries whose ids are non-empty strings, unique in the timeline',
    isValid: (value) =>
      Array.isArray(value) &&
      value.every((entry) => isRecord(entry) && typeof entry.id === 'string' && entry.id !== '') &&
      new Set(entriesOf(value).map((entry) => entry.id)).size === value.length,
  },
  {
    path: 'match.timeline',
    rule: 'every entry must be at one mark: { atTick: a whole number >= 0 } or { atFraction: 0 to 1 }',
    isValid: (value) => entriesOf(value).every((entry) => isMark(entry.at)),
  },
  {
    path: 'match.timeline',
    rule: 'every action must be of a known kind with valid fields',
    isValid: (value) => entriesOf(value).every((entry) => isKnownAction(entry.action)),
  },
  {
    path: 'match.timeline',
    rule: `enter-phase entries must not enter a terminal phase (${TERMINAL_MATCH_PHASES.join(', ')}): only a verdict does`,
    isValid: (_value, config) =>
      timelineOf(config).every(({ action }) => !TERMINAL_MATCH_PHASES.includes(action.phase)),
  },
  {
    path: 'match.timeline',
    rule: 'entries must be in tick order',
    isValid: (_value, config) => {
      // Safe: both fields passed their own rules above.
      const tickRate = valueAt(config, 'tickRate') as number;
      const planned = valueAt(config, 'match.plannedMatchSeconds') as number;
      let previous = 0;
      return timelineOf(config).every(({ at }) => {
        const tick = timelineMarkTick(at, tickRate, planned);
        const isInOrder = tick >= previous;
        previous = tick;
        return isInOrder;
      });
    },
  },
  {
    path: 'match.timeline',
    rule: `enter-phase entries must move forward through the match phases, after ${MATCH_PHASES[0]}`,
    isValid: (_value, config) => {
      let reached = 0; // the match starts in MATCH_PHASES[0]
      for (const { action } of timelineOf(config)) {
        const index = MATCH_PHASES.indexOf(action.phase);
        if (index <= reached) {
          return false;
        }
        reached = index;
      }
      return true;
    },
  },
  {
    path: 'match.timeline',
    rule: 'must have at least one enter-phase entry: the first one ends the countdown',
    isValid: (_value, config) => timelineOf(config).length > 0,
  },
  {
    path: 'match.timeline',
    rule: 'the first enter-phase entry ends the countdown, so it must be at tick round(match.countdownSeconds * tickRate)',
    isValid: (_value, config) => {
      // Safe: all three fields passed their own rules above.
      const tickRate = valueAt(config, 'tickRate') as number;
      const planned = valueAt(config, 'match.plannedMatchSeconds') as number;
      const countdownSeconds = valueAt(config, 'match.countdownSeconds') as number;
      const [first] = timelineOf(config);
      return (
        first !== undefined &&
        timelineMarkTick(first.at, tickRate, planned) === Math.round(countdownSeconds * tickRate)
      );
    },
  },
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
