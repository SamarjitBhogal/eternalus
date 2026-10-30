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

/** The rule a default config breaks with `timeline` in place of its own; `null` when valid. */
const timelineFailure = (timeline: unknown): string | null => {
  const config = createDefaultGameConfig();
  try {
    validateGameConfig({ ...config, match: { ...config.match, timeline } });
    return null;
  } catch (error) {
    if (error instanceof ConfigValidationError && error.path === 'match.timeline') {
      return error.rule;
    }
    throw error;
  }
};

const enterAt = (at: unknown, phase: string, id = phase) => ({
  id,
  at,
  action: { kind: 'enter-phase', phase },
});

const SHAPE_RULE =
  'must be an array of entries whose ids are non-empty strings, unique in the timeline';
const MARK_RULE =
  'every entry must be at one mark: { atTick: a whole number >= 0 } or { atFraction: 0 to 1 }';
const ACTION_RULE = 'every action must be of a known kind with valid fields';
const ORDER_RULE = 'entries must be in tick order';
const PHASE_RULE =
  'enter-phase entries must move forward through the match phases, after countdown';
const TERMINAL_RULE =
  'enter-phase entries must not enter a terminal phase (victory, defeat): only a verdict does';
const HAS_PHASE_ENTRY_RULE =
  'must have at least one enter-phase entry: the first one ends the countdown';
const COUNTDOWN_END_RULE =
  'the first enter-phase entry ends the countdown, so it must be at tick round(match.countdownSeconds * tickRate)';

/** The default 10 s countdown at 30 ticks/s: the tick the first enter-phase entry must be at. */
const COUNTDOWN_TICKS = 300;

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
    ['match.countdownSeconds', { match: { countdownSeconds: 1801 } }],
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

  it.each(['light', 'dark'] as const)('accepts %s as the player team', (playerTeam) => {
    expect(failurePath({ match: { playerTeam } })).toBeNull();
  });

  it.each(['neutral', 'Light', '', undefined])(
    'rejects a player team that is not playable (%s)',
    (playerTeam) => {
      const config = createDefaultGameConfig();
      expect(() =>
        validateGameConfig({ ...config, match: { ...config.match, playerTeam } }),
      ).toThrow(
        new ConfigValidationError('match.playerTeam', "must be a playable team: 'light' or 'dark'"),
      );
    },
  );

  it.each([
    null,
    { definitionId: 'warrior', at: { x: 0, y: 0 } },
    { definitionId: 'x', at: { x: 1600, y: 900 } },
  ])('accepts a seat of null or a Legend inside the world (%j)', (seat) => {
    expect(failurePath({ match: { seat } })).toBeNull();
  });

  it.each([undefined, 'warrior', { at: { x: 1, y: 1 } }, { definitionId: '', at: { x: 1, y: 1 } }])(
    'rejects a seat that is not null or a Legend id with a point (%j)',
    (seat) => {
      const config = createDefaultGameConfig();
      expect(() => validateGameConfig({ ...config, match: { ...config.match, seat } })).toThrow(
        new ConfigValidationError(
          'match.seat',
          'must be null or { definitionId: a non-empty string, at: a point }',
        ),
      );
    },
  );

  it.each([
    { x: -1, y: 10 },
    { x: 10, y: -0.5 },
    { x: 1600.5, y: 10 },
    { x: 10, y: 900.5 },
    { x: Number.NaN, y: 10 },
    { x: 10, y: Infinity },
    { x: '10', y: 10 },
    { y: 10 },
  ])('rejects a seat outside the world or not finite (%j)', (at) => {
    const config = createDefaultGameConfig();
    const seat = { definitionId: 'warrior', at };
    expect(() => validateGameConfig({ ...config, match: { ...config.match, seat } })).toThrow(
      new ConfigValidationError(
        'match.seat',
        'its point must be a finite point inside the world (map.worldWidth x map.worldHeight)',
      ),
    );
  });

  it('rejects a config with a missing section', () => {
    expect(() => validateGameConfig(withoutKey(createDefaultGameConfig(), 'match'))).toThrow(
      new ConfigValidationError(
        'match.legendsPerTeam',
        'must be a whole number from 1 to limits.maxLegendsPerTeam',
      ),
    );
  });
  describe('match.timeline (architecture 12 §3)', () => {
    it('accepts the default timeline, a skipped phase and two entries on one tick', () => {
      expect(timelineFailure(createDefaultGameConfig().match.timeline)).toBeNull();
      expect(
        timelineFailure([
          enterAt({ atTick: COUNTDOWN_TICKS }, 'mid-game'),
          enterAt({ atTick: COUNTDOWN_TICKS }, 'end-game'),
        ]),
      ).toBeNull();
    });

    it('accepts a countdown that ends on a fraction mark: the mark is resolved to a tick first', () => {
      // 450 s is a quarter of the planned 1800 s, so `atFraction: 0.25` is tick 13,500 = 450 * 30.
      const config = createDefaultGameConfig({
        match: {
          countdownSeconds: 450,
          timeline: [
            {
              id: 'countdown-over',
              at: { atFraction: 0.25 },
              action: { kind: 'enter-phase', phase: 'early-game' },
            },
          ],
        },
      });

      expect(validateGameConfig(config)).toBe(config);
    });

    it('rejects a countdown the timeline does not end on (SpawnSystem reads countdownSeconds)', () => {
      const config = createDefaultGameConfig();

      expect(() =>
        validateGameConfig({ ...config, match: { ...config.match, countdownSeconds: 20 } }),
      ).toThrow(new ConfigValidationError('match.timeline', COUNTDOWN_END_RULE));
    });

    it('names match.countdownSeconds, not the timeline, for a countdown longer than the planned match', () => {
      // The default timeline follows the override, so its countdown-over entry is out of tick order
      // too; the countdown rule runs first, so the error names the field that is wrong.
      expect(() =>
        validateGameConfig(createDefaultGameConfig({ match: { countdownSeconds: 1801 } })),
      ).toThrow(
        new ConfigValidationError(
          'match.countdownSeconds',
          'must not exceed match.plannedMatchSeconds (the countdown is part of the planned match)',
        ),
      );
    });

    it.each<[string, unknown, string]>([
      ['not an array', 'soon', SHAPE_RULE],
      ['an entry that is not an object', [7], SHAPE_RULE],
      ['an empty id', [enterAt({ atTick: 1 }, 'early-game', '')], SHAPE_RULE],
      [
        'a repeated id',
        [enterAt({ atTick: 1 }, 'early-game', 'x'), enterAt({ atTick: 2 }, 'mid-game', 'x')],
        SHAPE_RULE,
      ],
      ['a fraction above 1', [enterAt({ atFraction: 1.5 }, 'early-game')], MARK_RULE],
      ['a negative fraction', [enterAt({ atFraction: -0.1 }, 'early-game')], MARK_RULE],
      ['a negative tick', [enterAt({ atTick: -1 }, 'early-game')], MARK_RULE],
      ['a fractional tick', [enterAt({ atTick: 2.5 }, 'early-game')], MARK_RULE],
      ['two marks at once', [enterAt({ atTick: 1, atFraction: 0.5 }, 'early-game')], MARK_RULE],
      ['no mark', [enterAt({}, 'early-game')], MARK_RULE],
      [
        'an unknown action kind',
        [{ id: 'boss', at: { atTick: 1 }, action: { kind: 'summon-greater-boss' } }],
        ACTION_RULE,
      ],
      [
        'an action kind inherited from Object',
        [{ id: 'proto', at: { atTick: 1 }, action: { kind: 'toString' } }],
        ACTION_RULE,
      ],
      ['an unknown phase', [enterAt({ atTick: 1 }, 'overtime')], ACTION_RULE],
      ['a missing action', [{ id: 'none', at: { atTick: 1 } }], ACTION_RULE],
      [
        'unsorted entries',
        [enterAt({ atFraction: 0.5 }, 'early-game'), enterAt({ atFraction: 0.25 }, 'mid-game')],
        ORDER_RULE,
      ],
      ['an entry into the starting phase', [enterAt({ atTick: 1 }, 'countdown')], PHASE_RULE],
      [
        'a phase entered twice',
        [enterAt({ atTick: 1 }, 'early-game', 'a'), enterAt({ atTick: 2 }, 'early-game', 'b')],
        PHASE_RULE,
      ],
      [
        'an earlier phase after a later one',
        [enterAt({ atTick: 1 }, 'mid-game'), enterAt({ atTick: 2 }, 'quarter-mark')],
        PHASE_RULE,
      ],
      [
        'an entry into victory',
        [enterAt({ atTick: COUNTDOWN_TICKS }, 'early-game'), enterAt({ atTick: 9000 }, 'victory')],
        TERMINAL_RULE,
      ],
      ['an entry into defeat', [enterAt({ atTick: COUNTDOWN_TICKS }, 'defeat')], TERMINAL_RULE],
      ['an empty timeline (the countdown would never end)', [], HAS_PHASE_ENTRY_RULE],
      [
        'a first entry before the countdown ends',
        [enterAt({ atTick: COUNTDOWN_TICKS - 1 }, 'early-game')],
        COUNTDOWN_END_RULE,
      ],
      [
        'a first entry after the countdown ends',
        [enterAt({ atFraction: 0.25 }, 'early-game')],
        COUNTDOWN_END_RULE,
      ],
    ])('rejects %s', (_case, timeline, rule) => {
      expect(timelineFailure(timeline)).toBe(rule);
    });
  });
});
