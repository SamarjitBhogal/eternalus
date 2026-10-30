import { describe, expect, it } from 'vitest';

import { Health } from '../components/Health';
import { Transform } from '../components/Transform';

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
import { matchWorldOf } from '../state/__fixtures__/matchWorld';
import type { GameEventMap } from '../state/GameEvents.types';
import { StateHasher } from '../state/StateHasher';
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

/** The opening wave sent by a structure kind the test map does not have, so no opening hordes. */
const NO_OPENING = { ...OPENING_WAVE, source: 'camp' } as const;

const setUp = (
  overrides: DeepPartial<GameConfig> = {},
  plan: Partial<Pick<SpawnPlan, 'openingWave' | 'waves'>> = {},
) => {
  const config = createDefaultGameConfig({
    match: overrides.match ?? {},
    limits: overrides.limits ?? {},
  });
  const state = new GameState(config, 1, matchWorldOf(TWO_LANE_MAP));
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

const summary = (hordes: readonly GameEventMap['horde-spawned'][]) =>
  hordes.map(({ team, lane, memberIds }) => `${team} ${lane} ${String(memberIds.length)}`);

/** The tick the countdown ends, when every wave clock starts (DEC-87). */
const COUNTDOWN = Math.round(createDefaultGameConfig().match.countdownSeconds * TICK_RATE);
/** The first light, heavy and medium waves: 165, 180 and 195 s after the countdown (DEC-87, DEC-93). */
const LIGHT = COUNTDOWN + 165 * TICK_RATE;
const MEDIUM = COUNTDOWN + 195 * TICK_RATE;
const HEAVY = COUNTDOWN + 180 * TICK_RATE;

describe('SpawnSystem', () => {
  it('sends one opening light horde per lane from each Stronghold at tick 0, from the lane base', () => {
    const { state, spawned, runTo } = setUp();

    runTo(0);

    // Spawner id order: `stronghold-dark` before `stronghold-light`; lanes by index.
    expect(summary(spawned)).toEqual([
      'dark lane-0 16',
      'dark lane-1 16',
      'light lane-0 16',
      'light lane-1 16',
    ]);
    expect(state.entities.get(spawned[0]?.memberIds[0] ?? '')?.definitionId).toBe('light-minion');
    // Each horde forms around its lane's start at its own gate (x 20 for Light, x 180 for Dark),
    // not around the Stronghold (x 10 / x 190, y 30), and its anchor starts there.
    const centres = spawned.map(({ team, lane, memberIds }) => {
      const xs = memberIds.map((id) => state.entities.get(id)?.getComponent(Transform).position);
      const mean = (pick: (point: { x: number; y: number }) => number) =>
        xs.reduce((sum, point) => sum + (point === undefined ? 0 : pick(point)), 0) / xs.length;
      return `${team} ${lane} ${String(mean(({ x }) => x))} ${String(mean(({ y }) => y))}`;
    });
    expect(centres).toEqual([
      'dark lane-0 180 20',
      'dark lane-1 180 40',
      'light lane-0 20 20',
      'light lane-1 20 40',
    ]);
    const progress: number[] = [];
    state.hordes.forEach((horde) => progress.push(horde.progress));
    expect(progress).toEqual([0, 0, 0, 0]);
  });

  it('starts every wave clock at the countdown end: first waves at 165, 180 and 195 s, then each interval', () => {
    const { timeline, runTo } = setUp({}, { openingWave: NO_OPENING });

    runTo(LIGHT - 1);
    expect(timeline).toEqual([]);

    const at = (seconds: number) => String(COUNTDOWN + seconds * TICK_RATE);
    runTo(COUNTDOWN + 285 * TICK_RATE);
    // Lights every 60 s from 165 s, heavies every 90 s from 180 s, mediums every 60 s from 195 s.
    // Spawner id order within a tick: buff, spawner, then Stronghold, Dark before Light. The
    // heavy horde takes the worst lane: every lane ties at the start, so the middle (lane-1).
    expect(timeline).toEqual([
      `${at(165)} dark lane-0 16`,
      `${at(165)} light lane-0 16`,
      `${at(180)} dark lane-1 4`,
      `${at(180)} light lane-1 4`,
      `${at(195)} dark lane-1 8`,
      `${at(195)} light lane-1 8`,
      `${at(225)} dark lane-0 16`,
      `${at(225)} light lane-0 16`,
      `${at(255)} dark lane-1 8`,
      `${at(255)} light lane-1 8`,
      `${at(270)} dark lane-1 4`,
      `${at(270)} light lane-1 4`,
      `${at(285)} dark lane-0 16`,
      `${at(285)} light lane-0 16`,
    ]);
  });

  it('waits for the countdown: a longer countdown moves every first wave by the same time', () => {
    const { timeline, runTo } = setUp(
      { match: { countdownSeconds: 600 } },
      { openingWave: NO_OPENING },
    );
    const firstLight = (600 + 165) * TICK_RATE;

    runTo(firstLight - 1);
    expect(timeline).toEqual([]);

    runTo(firstLight);
    expect(timeline).toEqual([
      `${String(firstLight)} dark lane-0 16`,
      `${String(firstLight)} light lane-0 16`,
    ]);
  });

  it('sends a wave due at tick 0 along with the opening hordes', () => {
    const atOnce = {
      'spawner-tower': [
        {
          mobId: 'light-minion',
          weightClass: 'light',
          firstAtSeconds: 0,
          everySeconds: 60,
          lane: 'own-lane',
        },
      ],
    } as const;
    const { spawned, runTo } = setUp({ match: { countdownSeconds: 0 } }, { waves: atOnce });

    runTo(0);

    // Four opening hordes (two lanes, two teams), then each team's SpawnerTower wave on lane-0.
    expect(summary(spawned)).toHaveLength(6);
    expect(summary(spawned).slice(4)).toEqual(['dark lane-0 16', 'light lane-0 16']);
  });

  it('spawns the same hordes the same way twice: the same state hash at the first heavy wave', () => {
    const hashes = [1, 2].map(() => {
      const { state, runTo } = setUp();
      runTo(HEAVY);
      return new StateHasher().hash(state);
    });

    expect(hashes[0]).toBe(hashes[1]);
  });

  it('spawns only the members that fit under the unit cap and counts the rest', () => {
    // The two opening hordes (32) leave room for 12 of the first light wave; then none fits.
    const { state, spawned, runTo } = setUp({ limits: { maxUnitsPerTeam: 44 } });

    runTo(MEDIUM);

    expect(summary(spawned)).toContain('dark lane-0 12');
    // Requested: 32 opening + 16 light, then 4 heavy and 8 medium; kept out: 4, then all 12.
    expect(state.teams.dark).toEqual({
      unitsRequested: 60,
      unitsSuppressed: 16,
      towersLostByLane: {},
    });
    expect(spawned.every(({ memberIds }) => memberIds.length > 0)).toBe(true);
  });

  it('does not count a unit killed this tick, still in the store before DeathSystem, against the cap', () => {
    // The opening hordes fill the cap of 32 exactly; one of them dies before the next wave is due.
    const { state, spawned, runTo } = setUp({ limits: { maxUnitsPerTeam: 32 } });
    runTo(LIGHT - 1);
    const fallen = spawned.find(({ team }) => team === 'dark')?.memberIds[0] ?? '';
    state.entities.get(fallen)?.getComponent(Health).applyDamage(1e6);

    runTo(LIGHT);

    expect(state.entities.get(fallen)).toBeDefined();
    // The opening 32 all spawned; of the light wave since, the fallen unit's slot took exactly one.
    const { unitsRequested, unitsSuppressed } = state.teams.dark;
    expect(unitsRequested - 32 - unitsSuppressed).toBe(1);
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
    const { state, runTo } = setUp({}, { openingWave: NO_OPENING });

    // The medium wave is the last of the three first waves.
    runTo(MEDIUM);

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
    const towersOnly = Object.fromEntries(
      Object.entries(SPAWN_WAVES).filter(([kind]) => kind !== 'stronghold'),
    );
    const { state, runTo } = setUp({}, { waves: towersOnly });

    runTo(0);

    expect(state.hordes.size).toBe(4);
  });

  it.each<[string, Partial<Pick<SpawnPlan, 'openingWave' | 'waves'>>, RegExp]>([
    [
      'an unknown mob',
      {
        waves: {
          'spawner-tower': [
            {
              mobId: 'no-such-mob',
              weightClass: 'light',
              firstAtSeconds: 0,
              everySeconds: 60,
              lane: 'own-lane',
            },
          ],
        },
      },
      /unknown mob "no-such-mob"/,
    ],
    [
      'a mob of another weight class',
      { openingWave: { ...OPENING_WAVE, mobId: 'heavy-minion' } },
      /"heavy-minion" is light, but its kind is "heavy-mob"/,
    ],
    [
      'a wave that repeats more often than once a tick',
      {
        waves: {
          'spawner-tower': [
            {
              mobId: 'light-minion',
              weightClass: 'light',
              firstAtSeconds: 0,
              everySeconds: 0,
              lane: 'own-lane',
            },
          ],
        },
      },
      /spawner-tower wave repeats every 0 s/,
    ],
    [
      'a wave that starts before the countdown ends',
      {
        waves: {
          'spawner-tower': [
            {
              mobId: 'light-minion',
              weightClass: 'light',
              firstAtSeconds: -1,
              everySeconds: 60,
              lane: 'own-lane',
            },
          ],
        },
      },
      /spawner-tower wave starts -1 s after the countdown/,
    ],
  ])('rejects a plan with %s when it is built', (_, plan, message) => {
    const state = new GameState(createDefaultGameConfig(), 1, matchWorldOf(TWO_LANE_MAP));
    const factory = new EntityFactory(createDefaultEntityRegistry(), loadDefaultContent(TICK_RATE));

    expect(() => newSystem(state, factory, plan)).toThrow(message);
  });
});
