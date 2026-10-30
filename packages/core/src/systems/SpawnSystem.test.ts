import { describe, expect, it } from 'vitest';

import { createDefaultGameConfig } from '../config/defaultGameConfig';
import type { DeepPartial, GameConfig } from '../config/GameConfig.types';
import { HORDE_STEERING } from '../content/ai/hordeSteering';
import { LANE_ASSESSMENT_WEIGHTS } from '../content/ai/laneAssessmentWeights';
import { loadDefaultContent } from '../content/loadDefaultContent';
import { OPENING_WAVE, SPAWN_WAVES } from '../content/structures/spawnWaves';
import { NullLogger } from '../diagnostics/NullLogger';
import { createDefaultEntityRegistry } from '../entities/defaultEntityRegistry';
import { EntityFactory } from '../entities/EntityFactory';
import { TWO_LANE_MAP } from '../state/__fixtures__/twoLaneMap';
import { GameState } from '../state/GameState';
import type { GameEventMap } from '../state/GameEvents.types';
import { SpawnSystem } from './SpawnSystem';
import type { SpawnPlan } from './SpawnSystem.types';

const TICK_RATE = 30;

const newSystem = (
  state: GameState,
  factory: EntityFactory,
  plan: Partial<Pick<SpawnPlan, 'openingWave' | 'waves'>> = {},
) =>
  new SpawnSystem(state, factory, {
    definitions: loadDefaultContent(TICK_RATE),
    openingWave: plan.openingWave ?? OPENING_WAVE,
    waves: plan.waves ?? SPAWN_WAVES,
    steering: HORDE_STEERING,
    weights: LANE_ASSESSMENT_WEIGHTS,
    formationId: 'ranks',
  });

const setUp = (overrides: DeepPartial<GameConfig> = {}) => {
  const config = createDefaultGameConfig({
    match: { initialHordesPerTeam: 2, countdownSeconds: 2, ...overrides.match },
    limits: overrides.limits ?? {},
  });
  const state = new GameState(config, 1, TWO_LANE_MAP);
  const factory = new EntityFactory(createDefaultEntityRegistry(), loadDefaultContent(TICK_RATE));
  const system = newSystem(state, factory);
  const spawned: GameEventMap['horde-spawned'][] = [];
  state.events.on('horde-spawned', (horde) => spawned.push(horde));
  /** Runs the system for every tick up to and including `last`. */
  const runTo = (last: number) => {
    while (state.tick <= last) {
      system.update({ state, logger: new NullLogger() });
      state.advanceTick();
    }
  };
  return { state, spawned, runTo };
};

const summary = (hordes: readonly GameEventMap['horde-spawned'][]) =>
  hordes.map(({ team, lane, memberIds }) => `${team} ${lane} ${String(memberIds.length)}`);

describe('SpawnSystem', () => {
  it('sends the opening light hordes from each Stronghold at tick 0, one per lane', () => {
    const { state, spawned, runTo } = setUp();

    runTo(0);

    expect(summary(spawned)).toEqual([
      'light lane-0 16',
      'light lane-1 16',
      'dark lane-0 16',
      'dark lane-1 16',
    ]);
    expect(state.hordes.size).toBe(4);
    expect(state.entities.get(spawned[0]?.memberIds[0] ?? '')?.definitionId).toBe('light-minion');
  });

  it('starts every tower and Stronghold wave when the countdown ends, then repeats it', () => {
    const { spawned, runTo } = setUp({ match: { initialHordesPerTeam: 0 } });

    runTo(2 * TICK_RATE - 1);
    expect(spawned).toEqual([]);

    runTo(2 * TICK_RATE);
    expect(summary(spawned).sort()).toEqual([
      'dark lane-0 16',
      'dark lane-1 4',
      'dark lane-1 8',
      'light lane-0 16',
      'light lane-1 4',
      'light lane-1 8',
    ]);

    runTo((2 + 60) * TICK_RATE);
    expect(spawned.filter(({ memberIds }) => memberIds.length === 16)).toHaveLength(4);
  });

  it('spawns only the members that fit under the unit cap and counts the rest', () => {
    // Two opening hordes (32) and a medium horde (8) leave room for 4 of the next light horde.
    const { state, spawned, runTo } = setUp({ limits: { maxUnitsPerTeam: 44 } });

    runTo(2 * TICK_RATE);

    expect(summary(spawned)).toContain('dark lane-0 4');
    // Requested: 32 opening + 8 medium + 16 light + 4 heavy; kept out: 12 light and all 4 heavy.
    expect(state.teams.dark).toEqual({ unitsRequested: 60, unitsSuppressed: 16 });
    expect(spawned.every(({ memberIds }) => memberIds.length > 0)).toBe(true);
  });

  it('creates every member inside its horde record before announcing it', () => {
    const { state, runTo } = setUp();
    const orphans: string[] = [];
    state.events.on('entity-spawned', ({ entityId }) => {
      if (state.hordes.hordeOf(entityId) === undefined) {
        orphans.push(entityId);
      }
    });

    runTo(0);

    expect(state.entities.size).toBe(64);
    expect(orphans).toEqual([]);
  });

  it('starts each horde’s anchor at the lane point nearest its spawn point, never behind it', () => {
    const { state, runTo } = setUp({ match: { initialHordesPerTeam: 0 } });

    runTo(2 * TICK_RATE);

    const anchors: string[] = [];
    state.hordes.forEach(({ team, lane, weightClass, progress }) => {
      anchors.push(`${team} ${lane} ${weightClass} ${String(progress)}`);
    });
    // The light SpawnerTower at x 60 is 40 m up lane-0; the Strongholds sit behind their gates.
    expect(anchors).toContain('light lane-0 light 40');
    expect(anchors).toContain('dark lane-0 light 40');
    expect(anchors).toContain('light lane-1 medium 30');
    expect(anchors).toContain('light lane-1 heavy 0');
  });

  it('spawns nothing in a match without a map', () => {
    const state = new GameState(createDefaultGameConfig(), 1);
    const factory = new EntityFactory(createDefaultEntityRegistry(), loadDefaultContent(TICK_RATE));
    const system = newSystem(state, factory);

    system.update({ state, logger: new NullLogger() });

    expect(state.entities.size).toBe(0);
  });

  it('sends the opening hordes even when the Stronghold has no recurring waves', () => {
    const state = new GameState(
      createDefaultGameConfig({ match: { initialHordesPerTeam: 1 } }),
      1,
      TWO_LANE_MAP,
    );
    const factory = new EntityFactory(createDefaultEntityRegistry(), loadDefaultContent(TICK_RATE));
    const towersOnly = Object.fromEntries(
      Object.entries(SPAWN_WAVES).filter(([kind]) => kind !== 'stronghold'),
    );
    const system = newSystem(state, factory, { waves: towersOnly });

    system.update({ state, logger: new NullLogger() });

    expect(state.hordes.size).toBe(2);
  });

  it.each<[string, Partial<Pick<SpawnPlan, 'openingWave' | 'waves'>>, RegExp]>([
    [
      'an unknown mob',
      {
        waves: {
          'spawner-tower': [
            { mobId: 'no-such-mob', weightClass: 'light', everySeconds: 60, lane: 'own-lane' },
          ],
        },
      },
      /unknown mob "no-such-mob"/,
    ],
    [
      'a mob of another weight class',
      { openingWave: { mobId: 'heavy-minion', weightClass: 'light' } },
      /"heavy-minion" is light, but its kind is "heavy-mob"/,
    ],
  ])('rejects a plan with %s when it is built', (_, plan, message) => {
    const state = new GameState(createDefaultGameConfig(), 1, TWO_LANE_MAP);
    const factory = new EntityFactory(createDefaultEntityRegistry(), loadDefaultContent(TICK_RATE));

    expect(() => newSystem(state, factory, plan)).toThrow(message);
  });
});
