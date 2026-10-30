import { deepFreeze } from '../utils/deepFreeze';
import {
  MAX_LEGENDS_PER_TEAM,
  MAX_UNITS_PER_TEAM,
  SUPPORTED_TICK_RATE,
} from './GameConfig.constants';
import type { DeepPartial, GameConfig, MatchConfig } from './GameConfig.types';
import type { MatchTimelineEntry } from './MatchTimelineEntry.types';

/** MVP defaults (architecture 03 §10, requirements doc MVP list, integration contract §2.2). */
const DEFAULT_GAME_CONFIG: Omit<GameConfig, 'match'> & {
  // The timeline is built from the countdown (`defaultTimeline`), so it follows an override.
  readonly match: Omit<MatchConfig, 'timeline'>;
} = {
  tickRate: SUPPORTED_TICK_RATE,
  map: {
    numLanes: 3,
    spawnTowersPerLane: 1,
    buffTowersPerLane: 1,
    campsPerSide: 6,
    cornerCamps: 4, // MVP-if-time; 0 disables
    worldWidth: 1600, // TUNE: traced from the team sketch
    worldHeight: 900, // TUNE: traced from the team sketch
    navCellSize: 5, // TUNE: was DEFAULT_MAP_LAYOUT.navCellSize on feat/map-generator
    presetId: 'map-1',
  },
  match: {
    legendsPerTeam: 10, // 3 per lane on 3 lanes + the Rover (03 §10)
    legendsPerLane: 3,
    countdownSeconds: 10, // TUNE: the owner's "intro 10 second movement hold" (DEC-84)
    hordeSizes: { light: 16, medium: 8, heavy: 4 },
    initialHordesPerTeam: 3,
    plannedMatchSeconds: 1800, // TUNE: DEC-13's 30 minutes; a planning length, not a cap (owner 2026-10-28)
    // A placeholder: the client sets it from the player's setup; a sim-mode caller may set either side (12 §4).
    playerTeam: 'light',
    seat: null, // sim mode: no human; the client sets it from the player's setup
  },
  limits: {
    maxLegendsPerTeam: MAX_LEGENDS_PER_TEAM,
    maxUnitsPerTeam: MAX_UNITS_PER_TEAM,
  },
};

/** The default timeline (architecture 12 §3); the countdown ends at `countdownTicks`. */
const defaultTimeline = (countdownTicks: number): readonly MatchTimelineEntry[] => [
  // FR-003: the countdown (10 s by default, DEC-84)
  {
    id: 'countdown-over',
    at: { atTick: countdownTicks },
    action: { kind: 'enter-phase', phase: 'early-game' },
  },
  // TUNE: game doc, "the quarter mark of the game"
  {
    id: 'quarter-mark',
    at: { atFraction: 0.25 },
    action: { kind: 'enter-phase', phase: 'quarter-mark' },
  },
  // TUNE: game doc, the gem explodes mid-game
  { id: 'mid-game', at: { atFraction: 0.5 }, action: { kind: 'enter-phase', phase: 'mid-game' } },
  // TUNE: Recommendation, no source (12 §3)
  { id: 'end-game', at: { atFraction: 0.75 }, action: { kind: 'enter-phase', phase: 'end-game' } },
];

/**
 * The default `GameConfig` with `overrides` merged over it at every depth (an array, such as the
 * timeline, is replaced whole). Without a timeline override, the default timeline ends the
 * countdown at the merged `countdownSeconds`. The result is deeply frozen so a running match
 * cannot change its config. Not validated: pass it through `validateGameConfig()` (the
 * `Simulation` does) before relying on it.
 */
export const createDefaultGameConfig = (overrides: DeepPartial<GameConfig> = {}): GameConfig => {
  const { map, match, limits } = DEFAULT_GAME_CONFIG;
  const tickRate = overrides.tickRate ?? DEFAULT_GAME_CONFIG.tickRate;
  const { timeline, ...matchOverrides } = overrides.match ?? {};
  const countdownSeconds = matchOverrides.countdownSeconds ?? match.countdownSeconds;
  return deepFreeze({
    tickRate,
    map: { ...map, ...overrides.map },
    match: {
      ...match,
      ...matchOverrides,
      hordeSizes: { ...match.hordeSizes, ...matchOverrides.hordeSizes },
      timeline: [...(timeline ?? defaultTimeline(Math.round(countdownSeconds * tickRate)))],
    },
    limits: { ...limits, ...overrides.limits },
  });
};
