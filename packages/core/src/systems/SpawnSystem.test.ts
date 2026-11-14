import { describe, expect, it } from 'vitest';
import { Deploying } from '../components/Deploying';
import { Health } from '../components/Health';
import { Transform } from '../components/Transform';
import { createDefaultGameConfig } from '../config/defaultGameConfig';
import { HORDE_STEERING } from '../content/ai/hordeSteering';
import { loadDefaultContent } from '../content/loadDefaultContent';
import { OPENING_WAVE, SPAWN_WAVES } from '../content/structures/spawnWaves';
import { NullLogger } from '../diagnostics/NullLogger';
import { createDefaultEntityRegistry } from '../entities/defaultEntityRegistry';
import { EntityFactory } from '../entities/EntityFactory';
import { TWO_LANE_MAP } from '../state/__fixtures__/twoLaneMap';
import { GameState } from '../state/GameState';
import { spawnMapStructures } from '../state/__fixtures__/spawnMapStructures';
import { matchWorldOf } from '../state/__fixtures__/matchWorld';
import { Unit } from '../entities/Unit';
import type { Vec2 } from '../utils/geometry.types';
import type { SpawnPlan } from './SpawnSystem.types';
import {
  newSystem,
  NO_OPENING,
  setUp,
  summary,
  LIGHT,
  MEDIUM,
  HEAVY,
  TICK_RATE,
} from './__fixtures__/spawnSystemSetup';

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

  it('spawns only the members that fit under the unit cap and counts the rest', () => {
    // The opening hordes (32) and the first heavy horde (4) leave room for 8 of the first light
    // wave; then none fits.
    const { state, spawned, runTo } = setUp({ limits: { maxUnitsPerTeam: 44 } });

    runTo(MEDIUM);

    expect(summary(spawned)).toContain('dark lane-0 8');
    // Requested: 32 opening + 4 heavy, then 16 light and 8 medium; kept out: 8, then all 8.
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

    expect(
      state.entities.countOnTeam('light', Unit) + state.entities.countOnTeam('dark', Unit),
    ).toBe(64);
    expect(orphans).toEqual([]);
  });

  it('faces every member toward the enemy Stronghold until it first moves (DEC-216 (6))', () => {
    const { state, runTo } = setUp();
    const strongholds: Record<string, Vec2> = { light: { x: 190, y: 30 }, dark: { x: 10, y: 30 } };
    let members = 0;

    runTo(0);

    state.entities.forEach((entity) => {
      const team = state.entities.teamOf(entity.id);
      if (!(entity instanceof Unit) || team === undefined) return;
      const { position, facing } = entity.getComponent(Transform);
      const target = strongholds[team];
      if (target === undefined) throw new Error(`no enemy Stronghold for ${team}`);
      const length = Math.hypot(target.x - position.x, target.y - position.y);
      expect(facing.x).toBeCloseTo((target.x - position.x) / length, 9);
      expect(facing.y).toBeCloseTo((target.y - position.y) / length, 9);
      members += 1;
    });
    expect(members).toBe(64);
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

  it('walks a horde spawned inside its structure out along its march axis; one on open ground keeps its brain (DEC-133)', () => {
    // The lane-0 SpawnerTowers (x 60 and x 140, y 20) block a 16 m square; the BuffTowers nothing.
    const map = {
      ...TWO_LANE_MAP,
      features: TWO_LANE_MAP.features.map((feature) => {
        const { x, y } = feature.position;
        return feature.kind === 'spawner-tower'
          ? {
              ...feature,
              footprint: [
                { x: x - 8, y: y - 8 },
                { x: x + 8, y: y - 8 },
                { x: x + 8, y: y + 8 },
                { x: x - 8, y: y + 8 },
              ],
            }
          : feature;
      }),
    };
    const world = matchWorldOf(map);
    const state = new GameState(createDefaultGameConfig(), 1, world);
    const factory = new EntityFactory(createDefaultEntityRegistry(), loadDefaultContent(TICK_RATE));
    const system = newSystem(state, factory, { openingWave: NO_OPENING });
    for (const id of ['spawner-light-0', 'spawner-dark-0', 'buff-light-1']) {
      const feature = map.features.find((candidate) => candidate.id === id);
      if (feature?.laneId === undefined || feature.team === 'neutral') {
        throw new Error(`fixture lacks ${id}`);
      }
      const { team, laneId: lane, position: origin } = feature;
      state.hordeRequests.push({
        team,
        mobId: 'light-minion',
        weightClass: 'light',
        count: 16,
        lane,
        origin,
      });
    }

    system.update({ state, logger: new NullLogger() });

    const { grid } = world;
    const isOpen = ({ x, y }: { x: number; y: number }) =>
      grid.isWalkable(Math.floor(x / grid.cellSize), Math.floor(y / grid.cellSize));
    const walks: Record<string, { readonly from: Transform['position']; readonly to?: Vec2 }[]> =
      {};
    state.hordes.forEach(({ team, lane, memberIds }) => {
      walks[`${team} ${lane}`] = memberIds.map((id) => {
        const entity = state.entities.get(id);
        const exit = entity?.findComponent(Deploying)?.exit;
        const from = { ...(entity?.getComponent(Transform).position ?? { x: 0, y: 0 }) };
        return exit === undefined ? { from } : { from, to: exit };
      });
    });
    const clearance = HORDE_STEERING.deployClearance;
    const light = walks['light lane-0'] ?? [];
    const dark = walks['dark lane-0'] ?? [];
    expect(light).toHaveLength(16);
    expect(dark).toHaveLength(16);
    // Light marches east, Dark west: each member walks straight along x, in formation, past the
    // square plus the clearance, onto open ground.
    for (const [walk, sign, clear] of [
      [light, 1, (x: number) => x >= 68 + clearance],
      [dark, -1, (x: number) => x <= 132 - clearance],
    ] as const) {
      const steps = walk.map(({ from, to }) => ((to?.x ?? from.x) - from.x) * sign);
      expect(new Set(steps).size).toBe(1);
      expect(steps[0]).toBeGreaterThan(0);
      for (const { from, to } of walk) {
        expect(to?.y).toBe(from.y);
        expect(clear(to?.x ?? from.x) && isOpen(to ?? from)).toBe(true);
      }
    }
    expect(walks['light lane-1']?.map(({ to }) => to)).toEqual(Array(16).fill(undefined));
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
    spawnMapStructures(state);
    const factory = new EntityFactory(createDefaultEntityRegistry(), loadDefaultContent(TICK_RATE));

    expect(() => newSystem(state, factory, plan)).toThrow(message);
  });

  it('sends the heavy horde down the lane its allies were hurt on, then clears that team’s tally (DEC-89)', () => {
    const { state, spawned, runTo } = setUp({}, { openingWave: NO_OPENING });
    // Dark's Stronghold is down, so only Light sends a heavy horde and only Light's tally clears.
    state.entities.forEach((entity) => {
      if (entity.kind === 'stronghold' && state.entities.teamOf(entity.id) === 'dark') {
        entity.getComponent(Health).applyDamage(1e6);
      }
    });
    state.allyDamage.add('light', 'lane-0', 40);
    state.allyDamage.add('dark', 'lane-1', 25);

    runTo(HEAVY);

    const heavies = spawned.filter(({ memberIds }) => memberIds.length === 4);
    // Without the tally Light would tie on both lanes and take the middle one, lane-1.
    expect(summary(heavies)).toEqual(['light lane-0 4']);
    expect(state.allyDamage.share('light', 'lane-0')).toBe(0);
    expect(state.allyDamage.share('dark', 'lane-1')).toBe(1);
  });

  it('stops a destroyed tower’s waves', () => {
    const { state, runTo } = setUp({}, { openingWave: NO_OPENING });
    state.entities.forEach((entity) => {
      if (entity.kind === 'spawner-tower' && state.entities.teamOf(entity.id) === 'dark') {
        entity.getComponent(Health).applyDamage(1e6);
      }
    });

    runTo(LIGHT);

    // Only the SpawnerTowers send light hordes once the opening wave is off.
    const light: string[] = [];
    state.hordes.forEach(({ team, weightClass }) => {
      if (weightClass === 'light') {
        light.push(team);
      }
    });
    expect(light).toEqual(['light']);
  });
});
