import { createDefaultGameConfig } from '../../config/defaultGameConfig';
import type { DeepPartial, GameConfig } from '../../config/GameConfig.types';
import { HORDE_STEERING } from '../../content/ai/hordeSteering';
import { LANE_ASSESSMENT_WEIGHTS } from '../../content/ai/laneAssessmentWeights';
import { loadDefaultContent } from '../../content/loadDefaultContent';
import { OPENING_WAVE, SPAWN_WAVES } from '../../content/structures/spawnWaves';
import { NullLogger } from '../../diagnostics/NullLogger';
import { createDefaultEntityRegistry } from '../../entities/defaultEntityRegistry';
import { EntityFactory } from '../../entities/EntityFactory';
import { TWO_LANE_MAP } from '../../state/__fixtures__/twoLaneMap';
import { GameState } from '../../state/GameState';
import { spawnMapStructures } from '../../state/__fixtures__/spawnMapStructures';
import { matchWorldOf } from '../../state/__fixtures__/matchWorld';
import type { GameEventMap } from '../../state/GameEvents.types';
import { SpawnSystem } from '../SpawnSystem';
import type { SpawnPlan } from '../SpawnSystem.types';

/** The simulation tick rate the fixtures use. */
export const TICK_RATE = 30;

/** A SpawnSystem over `state` with the default steering and weights and the given plan overrides. */
export const newSystem = (
  state: GameState,
  factory: EntityFactory,
  plan: Partial<Pick<SpawnPlan, 'openingWave' | 'waves' | 'guards'>> = {},
) =>
  new SpawnSystem(state, factory, {
    definitions: loadDefaultContent(TICK_RATE),
    openingWave: plan.openingWave ?? OPENING_WAVE,
    waves: plan.waves ?? SPAWN_WAVES,
    steering: HORDE_STEERING,
    weights: LANE_ASSESSMENT_WEIGHTS,
    formationId: 'ranks',
    guards: plan.guards ?? {},
  });

/** The opening wave sent by a structure kind the test map does not have, so no opening hordes. */
export const NO_OPENING = { ...OPENING_WAVE, source: 'camp' } as const;

/** A TWO_LANE_MAP match with its structures built and the system, with spawned hordes and a timeline recorded. */
export const setUp = (
  overrides: DeepPartial<GameConfig> = {},
  plan: Partial<Pick<SpawnPlan, 'openingWave' | 'waves'>> = {},
) => {
  const config = createDefaultGameConfig({
    match: overrides.match ?? {},
    limits: overrides.limits ?? {},
  });
  const state = new GameState(config, 1, matchWorldOf(TWO_LANE_MAP));
  spawnMapStructures(state);
  const factory = new EntityFactory(createDefaultEntityRegistry(), loadDefaultContent(TICK_RATE));
  const system = newSystem(state, factory, plan);
  const spawned: GameEventMap['horde-spawned'][] = [];
  const timeline: string[] = [];
  state.events.on('horde-spawned', (horde) => {
    spawned.push(horde);
    timeline.push(
      `${String(state.tick)} ${horde.team} ${horde.lane} ${String(horde.memberIds.length)}`,
    );
  });
  /** Runs the system for every tick up to and including `last`. */
  const runTo = (last: number) => {
    while (state.tick <= last) {
      system.update({ state, logger: new NullLogger() });
      state.advanceTick();
    }
  };
  return { state, spawned, timeline, runTo };
};

/** Each horde as `team lane size`. */
export const summary = (hordes: readonly GameEventMap['horde-spawned'][]) =>
  hordes.map(({ team, lane, memberIds }) => `${team} ${lane} ${String(memberIds.length)}`);

/** The tick the countdown ends, when every wave clock starts (DEC-87). */
export const COUNTDOWN = Math.round(createDefaultGameConfig().match.countdownSeconds * TICK_RATE);
/** The first heavy, light and medium waves: 180, 200 and 230 s after the countdown (DEC-87, DEC-127). */
export const LIGHT = COUNTDOWN + 200 * TICK_RATE;
export const MEDIUM = COUNTDOWN + 230 * TICK_RATE;
export const HEAVY = COUNTDOWN + 180 * TICK_RATE;
