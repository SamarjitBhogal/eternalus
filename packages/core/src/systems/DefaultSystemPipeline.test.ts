import { afterEach, describe, expect, it, vi } from 'vitest';

import { TEST_DEBUG_CONFIG } from '../diagnostics/InvariantRunner.constants';

import { DamagePipeline } from '../combat/DamagePipeline';
import { Health } from '../components/Health';
import { Movement } from '../components/Movement';
import { Transform } from '../components/Transform';
import { Progression } from '../components/Progression';
import { createDefaultGameConfig } from '../config/defaultGameConfig';
import { MATCH_PHASES, TERMINAL_MATCH_PHASES } from '../config/matchPhases';
import { loadDefaultContent } from '../content/loadDefaultContent';
import { loadLevelCurves } from '../content/progression/loadLevelCurves';
import { XP_SOURCES } from '../content/progression/xpSources';
import { DefaultInvariantRunner } from '../diagnostics/DefaultInvariantRunner';
import { MemoryLogger } from '../diagnostics/MemoryLogger';
import { createDefaultEntityRegistry } from '../entities/defaultEntityRegistry';
import { EntityFactory } from '../entities/EntityFactory';
import { LaneFlowFields } from '../map/LaneFlowFields';
import { TWO_LANE_MAP } from '../state/__fixtures__/twoLaneMap';
import { SpaceIndex } from '../physics/SpaceIndex';
import { GameState } from '../state/GameState';
import { matchWorldOf } from '../state/__fixtures__/matchWorld';
import { DefaultSystemPipeline } from './DefaultSystemPipeline';
import { Fort } from './__fixtures__/Fort';
import { BLOCKED_LANE_MAP } from '../map/__fixtures__/blockedLaneMap';
import { SystemPipeline } from './SystemPipeline';
import { STRUCTURE_DEFINITIONS } from '../content/structures/structureCatalogue';
import { loadWeapons } from '../content/weapons/loadWeapons';
import { MAP_OBJECT_DEFINITIONS } from '../content/maps/mapObjectDefinitions';
import type { MapObject } from '../content/maps/mapObjects.types';
import type { MapFeature } from '../content/maps/maps.types';
import { WorldObjectStore } from '../state/WorldObjectStore';

const UNIT_DEFINITIONS = loadDefaultContent(createDefaultGameConfig().tickRate);
const newFactory = (): EntityFactory =>
  new EntityFactory(
    createDefaultEntityRegistry(),
    UNIT_DEFINITIONS,
    undefined,
    loadWeapons(createDefaultGameConfig().tickRate),
  );
const PROGRESSION = { units: UNIT_DEFINITIONS, curves: loadLevelCurves(), xpSources: XP_SOURCES };
/** A director that leaves the match as it is, for the tests about the other systems. */
const IDLE_DIRECTOR = { update: () => undefined };

describe('DefaultSystemPipeline', () => {
  it('moves, then removes the dead, then checks invariants, in that order', () => {
    const logger = new MemoryLogger();
    const state = new GameState(createDefaultGameConfig(), 1);
    const pipeline = new DefaultSystemPipeline({
      invariants: new DefaultInvariantRunner({
        debug: TEST_DEBUG_CONFIG,
        logger,
        curves: PROGRESSION.curves,
        phaseOrder: MATCH_PHASES,
        terminalPhases: TERMINAL_MATCH_PHASES,
      }),
      state,
      progression: PROGRESSION,
      director: IDLE_DIRECTOR,
    });
    const factory = newFactory();
    const runner = factory.create('warrior', 'warrior', {
      position: { x: 0, y: 0 },
      team: 'light',
    });
    const victim = factory.create('light-mob', 'training-dummy', {
      position: { x: 5, y: 5 },
      team: 'dark',
    });
    state.entities.add(runner);
    state.entities.add(victim);
    runner.getComponent(Movement).steer({ x: 1, y: 0 });
    new DamagePipeline().apply(state, victim.id, 1000, {
      attackerId: runner.id,
      kind: 'weapon',
      definitionId: 'warrior',
    });

    pipeline.run({ state, logger });

    expect(pipeline).toBeInstanceOf(SystemPipeline);
    expect(runner.getComponent(Movement).speed).toBeGreaterThan(0);
    expect(state.entities.has(victim.id)).toBe(false);
    expect(logger.records).toEqual([]);
  });

  it('runs the horde systems in the order of architecture 10 §9, 11 §3 and 18 §3.2, collision right after movement (DEC-121 (c)), stuck detection before steering (DEC-193)', () => {
    const logger = new MemoryLogger();
    const space = new SpaceIndex(TWO_LANE_MAP.width, TWO_LANE_MAP.height, 2);
    const state = new GameState(createDefaultGameConfig(), 1, matchWorldOf(TWO_LANE_MAP), {
      space,
    });
    const factory = new EntityFactory(createDefaultEntityRegistry(), UNIT_DEFINITIONS);
    state.worldObjects = new WorldObjectStore({
      objects: [],
      factory,
      entities: state.entities,
      definitions: MAP_OBJECT_DEFINITIONS,
    });

    const pipeline = new DefaultSystemPipeline({
      invariants: new DefaultInvariantRunner({
        debug: TEST_DEBUG_CONFIG,
        logger,
        curves: PROGRESSION.curves,
        phaseOrder: MATCH_PHASES,
        terminalPhases: TERMINAL_MATCH_PHASES,
      }),
      state,
      progression: PROGRESSION,
      director: IDLE_DIRECTOR,
      hordes: {
        factory,
        space,
        decide: [{ name: 'ai', update: () => undefined }],
        collisions: [{ name: 'collision', update: () => undefined }],
      },
    });

    // Collision resolves positions before the index, steering, combat and next tick's AI read them.
    // Combat runs after movement, so a unit with a target in reach faces it, not its own way (DEC-192).
    expect(pipeline.names).toEqual([
      'ai',
      'hordes',
      'status-effects',
      'movement',
      'collision',
      'space',
      'stuck',
      'pathing',
      'combat',
      'map-destruction',
      'progression',
      'veterancy',
      'structure',
      'spawn',
      'enraged',
      'death',
      'match-director',
      'invariants',
    ]);
  });

  it('lands attacks after movement and before death, so a unit killed this tick leaves this tick', () => {
    const logger = new MemoryLogger();
    const state = new GameState(createDefaultGameConfig(), 1);
    const pipeline = new DefaultSystemPipeline({
      invariants: new DefaultInvariantRunner({
        debug: TEST_DEBUG_CONFIG,
        logger,
        curves: PROGRESSION.curves,
        phaseOrder: MATCH_PHASES,
        terminalPhases: TERMINAL_MATCH_PHASES,
      }),
      state,
      progression: PROGRESSION,
      director: IDLE_DIRECTOR,
    });
    const factory = newFactory();
    const warrior = factory.create('warrior', 'warrior', {
      position: { x: 0, y: 0 },
      team: 'light',
    });
    const victim = factory.create('light-mob', 'training-dummy', {
      position: { x: 1, y: 0 },
      team: 'dark',
    });
    state.entities.add(warrior);
    state.entities.add(victim);
    const health = victim.getComponent(Health);
    health.applyDamage(health.max - 1);
    state.entities.setAttackTarget(warrior.id, victim.id);

    pipeline.run({ state, logger });

    expect(state.entities.has(victim.id)).toBe(false);
    expect(logger.records).toEqual([]);
  });

  it('turns a steered attacker to its target in reach, not along its movement (DEC-192)', () => {
    const logger = new MemoryLogger();
    const state = new GameState(createDefaultGameConfig(), 1);
    const pipeline = new DefaultSystemPipeline({
      invariants: new DefaultInvariantRunner({
        debug: TEST_DEBUG_CONFIG,
        logger,
        curves: PROGRESSION.curves,
        phaseOrder: MATCH_PHASES,
        terminalPhases: TERMINAL_MATCH_PHASES,
      }),
      state,
      progression: PROGRESSION,
      director: IDLE_DIRECTOR,
    });
    const factory = newFactory();
    const warrior = factory.create('warrior', 'warrior', {
      position: { x: 0, y: 0 },
      team: 'light',
    });
    const dummy = factory.create('light-mob', 'training-dummy', {
      position: { x: -1, y: 0 },
      team: 'dark',
    });
    state.entities.add(warrior);
    state.entities.add(dummy);
    state.entities.setAttackTarget(warrior.id, dummy.id);
    warrior.getComponent(Movement).steer({ x: 0, y: 1 });

    pipeline.run({ state, logger });

    expect(warrior.getComponent(Movement).velocity.y).toBeGreaterThan(0);
    expect(warrior.getComponent(Transform).facing.x).toBeLessThan(-0.99);
    expect(logger.records).toEqual([]);
  });

  it('pays a combat kill in the same tick, before the dead are removed', () => {
    const logger = new MemoryLogger();
    const state = new GameState(createDefaultGameConfig(), 1);
    const pipeline = new DefaultSystemPipeline({
      invariants: new DefaultInvariantRunner({
        debug: TEST_DEBUG_CONFIG,
        logger,
        curves: PROGRESSION.curves,
        phaseOrder: MATCH_PHASES,
        terminalPhases: TERMINAL_MATCH_PHASES,
      }),
      state,
      progression: PROGRESSION,
      director: IDLE_DIRECTOR,
    });
    const factory = newFactory();
    const warrior = factory.create('warrior', 'warrior', {
      position: { x: 0, y: 0 },
      team: 'light',
    });
    const minion = factory.create('light-mob', 'light-minion', {
      position: { x: 1, y: 0 },
      team: 'dark',
    });
    state.entities.add(warrior);
    state.entities.add(minion);
    const health = minion.getComponent(Health);
    health.applyDamage(health.max - 1);
    state.entities.setAttackTarget(warrior.id, minion.id);

    pipeline.run({ state, logger });

    expect(warrior.getComponent(Progression).xp).toBe(20);
    expect(state.entities.has(minion.id)).toBe(false);
    expect(logger.records).toEqual([]);
  });

  it('pays a killer that also died this tick, so progression runs before death', () => {
    const logger = new MemoryLogger();
    const state = new GameState(createDefaultGameConfig(), 1);
    const pipeline = new DefaultSystemPipeline({
      invariants: new DefaultInvariantRunner({
        debug: TEST_DEBUG_CONFIG,
        logger,
        curves: PROGRESSION.curves,
        phaseOrder: MATCH_PHASES,
        terminalPhases: TERMINAL_MATCH_PHASES,
      }),
      state,
      progression: PROGRESSION,
      director: IDLE_DIRECTOR,
    });
    const factory = newFactory();
    const warrior = factory.create('warrior', 'warrior', {
      position: { x: 0, y: 0 },
      team: 'light',
    });
    const minion = factory.create('light-mob', 'light-minion', {
      position: { x: 5, y: 0 },
      team: 'dark',
    });
    state.entities.add(warrior);
    state.entities.add(minion);
    const damage = new DamagePipeline();
    damage.apply(state, minion.id, 1_000_000, {
      attackerId: warrior.id,
      kind: 'weapon',
      definitionId: 'warrior',
    });
    damage.apply(state, warrior.id, 1_000_000, {
      attackerId: minion.id,
      kind: 'weapon',
      definitionId: 'light-minion',
    });

    pipeline.run({ state, logger });

    const awards = state.events
      .recentEvents()
      .filter((event) => event.type === 'xp-gained')
      .map((event) => event.payload);
    expect(awards).toEqual([
      {
        entityId: warrior.id,
        amount: 20,
        victimId: minion.id,
        victimTeam: 'dark',
        cause: 'kill',
      },
    ]);
    expect(state.entities.has(warrior.id)).toBe(false);
    expect(logger.records).toEqual([]);
  });
  it('runs the match director after death and before the invariants', () => {
    const logger = new MemoryLogger();
    const state = new GameState(createDefaultGameConfig(), 1);
    const factory = new EntityFactory(createDefaultEntityRegistry(), UNIT_DEFINITIONS);
    const victim = factory.create('light-mob', 'training-dummy', {
      position: { x: 5, y: 5 },
      team: 'dark',
    });
    state.entities.add(victim);
    new DamagePipeline().apply(state, victim.id, 1000, {
      attackerId: null,
      kind: 'environment',
      definitionId: 'test',
    });
    const seenByDirector: boolean[] = [];
    const pipeline = new DefaultSystemPipeline({
      invariants: new DefaultInvariantRunner({
        debug: TEST_DEBUG_CONFIG,
        logger,
        curves: PROGRESSION.curves,
        phaseOrder: MATCH_PHASES,
        terminalPhases: TERMINAL_MATCH_PHASES,
      }),
      state,
      progression: PROGRESSION,
      director: {
        update: (directed) => {
          seenByDirector.push(directed.entities.has(victim.id));
          // Not a forward move: the invariants, if they run after, throw on it this tick.
          directed.match.setPhase('countdown');
        },
      },
    });

    expect(() => {
      pipeline.run({ state, logger });
    }).toThrow('phase-monotonic');
    expect(seenByDirector).toEqual([false]);
  });

  it('pays a destroyed structure to every living Legend of the other team, once, a tick later (DEC-186)', () => {
    const logger = new MemoryLogger();
    const state = new GameState(createDefaultGameConfig(), 1);
    const pipeline = new DefaultSystemPipeline({
      invariants: new DefaultInvariantRunner({
        debug: TEST_DEBUG_CONFIG,
        logger,
        curves: PROGRESSION.curves,
        phaseOrder: MATCH_PHASES,
        terminalPhases: TERMINAL_MATCH_PHASES,
      }),
      state,
      progression: PROGRESSION,
      director: IDLE_DIRECTOR,
    });
    const factory = new EntityFactory(
      createDefaultEntityRegistry(),
      {
        has: (id) => UNIT_DEFINITIONS.has(id) || STRUCTURE_DEFINITIONS.has(id),
        get: (id) =>
          UNIT_DEFINITIONS.has(id) ? UNIT_DEFINITIONS.get(id) : STRUCTURE_DEFINITIONS.get(id),
      },
      undefined,
      loadWeapons(createDefaultGameConfig().tickRate),
    );
    const add = (kind: string, definitionId: string, team: 'light' | 'dark') => {
      const entity = factory.create(kind, definitionId, { position: { x: 0, y: 0 }, team });
      state.entities.add(entity);
      return entity;
    };
    const lights = [add('warrior', 'warrior', 'light'), add('magus', 'magus', 'light')];
    const dark = add('warrior', 'warrior', 'dark');
    const tower = add('spawner-tower', 'spawner-tower', 'dark');
    new DamagePipeline().apply(state, tower.id, 1_000_000, {
      attackerId: lights[0]?.id ?? '',
      kind: 'weapon',
      definitionId: 'warrior',
    });

    // Tick 1: Progression runs before Structure, so the fall is announced after it; Death removes it.
    pipeline.run({ state, logger });
    expect(state.entities.has(tower.id)).toBe(false);
    expect(lights.map((l) => l.getComponent(Progression).xp)).toEqual([0, 0]);

    // Tick 2: the award is paid with the structure already gone, which the invariant requires.
    state.advanceTick();
    pipeline.run({ state, logger });
    // Tick 3: nothing is paid twice.
    state.advanceTick();
    pipeline.run({ state, logger });

    expect(lights.map((l) => l.getComponent(Progression).xp)).toEqual([
      XP_SOURCES.structureDestroyed,
      XP_SOURCES.structureDestroyed,
    ]);
    expect(dark.getComponent(Progression).xp).toBe(0);
    expect(logger.records).toEqual([]);
  });

  const footprint = [
    { x: 40, y: 20 },
    { x: 50, y: 20 },
    { x: 50, y: 30 },
    { x: 40, y: 30 },
  ];
  const wallFeature: MapFeature = {
    id: 'wall',
    kind: 'wall-segment',
    team: 'light',
    definitionId: 'wall-segment',
    position: { x: 45, y: 25 },
    minimapGlyph: { shape: 'square', size: 2, colourRole: 'team' },
    footprint,
  };
  afterEach(() => {
    vi.restoreAllMocks();
  });
  it.each([
    { name: 'a house', kind: 'house' as const, features: [], hasLanes: true },
    // The grid stamps a wall segment twice: as its map feature and as its object (07 §10).
    {
      name: 'a wall segment its map feature also blocks',
      kind: 'wall' as const,
      features: [wallFeature],
      hasLanes: true,
    },
    // Without the horde systems there are no lane fields, but the grid still reopens.
    { name: 'a house, with no lane fields', kind: 'house' as const, features: [], hasLanes: false },
  ])(
    'reopens the pathing cells and lane fields of $name once it is destroyed (07 §10)',
    ({ kind, features, hasLanes }) => {
      const markDirty = vi.spyOn(LaneFlowFields.prototype, 'markDirty');
      const map = { ...TWO_LANE_MAP, features };
      const state = new GameState(createDefaultGameConfig(), 1, matchWorldOf(map, 5));
      const house: MapObject = { id: kind, kind, isBlocking: true, footprints: [footprint] };
      const objects = new Map(Object.values(MAP_OBJECT_DEFINITIONS).map((d) => [d.id, d]));
      const factory = new EntityFactory(createDefaultEntityRegistry(), {
        has: (id) => objects.has(id) || UNIT_DEFINITIONS.has(id),
        get: (id) => objects.get(id) ?? UNIT_DEFINITIONS.get(id),
      });
      state.worldObjects = new WorldObjectStore({
        objects: [house],
        factory,
        entities: state.entities,
        definitions: MAP_OBJECT_DEFINITIONS,
      });
      const world = state.world?.grid;
      for (const footprint of house.footprints) world?.stampFootprint(footprint);
      const pipeline = new DefaultSystemPipeline({
        invariants: new DefaultInvariantRunner({
          debug: TEST_DEBUG_CONFIG,
          logger: new MemoryLogger(),
          curves: PROGRESSION.curves,
          phaseOrder: MATCH_PHASES,
          terminalPhases: TERMINAL_MATCH_PHASES,
        }),
        state,
        progression: PROGRESSION,
        director: IDLE_DIRECTOR,
        ...(hasLanes ? { hordes: { factory, space: null, decide: [] } } : {}),
      });
      const entityId = state.worldObjects.snapshot()[0]?.entityId ?? '';
      expect(world?.isWalkable(9, 5)).toBe(false);

      new DamagePipeline().apply(state, entityId, 1_000_000, {
        attackerId: 'nobody',
        kind: 'weapon',
        definitionId: 'warrior',
      });
      pipeline.run({ state, logger: new MemoryLogger() });

      expect(state.entities.has(entityId)).toBe(false);
      expect(world?.isWalkable(9, 5)).toBe(true);
      const reopened = markDirty.mock.calls.flatMap(([cells]) => cells);
      expect(reopened.includes(5 * (world?.cols ?? 0) + 9)).toBe(hasLanes);
    },
  );
  it('gives steering the fort boxes of the structures standing when it is built, so a fallen tower keeps its box', () => {
    const logger = new MemoryLogger();
    const space = new SpaceIndex(BLOCKED_LANE_MAP.width, BLOCKED_LANE_MAP.height, 2);
    const state = new GameState(createDefaultGameConfig(), 1, matchWorldOf(BLOCKED_LANE_MAP), {
      space,
    });
    const factory = newFactory();
    const fort = new Fort('fort', 'spawner-tower');
    // The fort's walls (x 50..52 and 68..70, y 10..30) give a box round the rift.
    fort.spawn({
      at: { x: 60, y: 20 },
      polygons: [
        [
          { x: 50, y: 10 },
          { x: 52, y: 10 },
          { x: 52, y: 30 },
          { x: 50, y: 30 },
        ],
        [
          { x: 68, y: 10 },
          { x: 70, y: 10 },
          { x: 70, y: 30 },
          { x: 68, y: 30 },
        ],
      ],
    });
    state.entities.add(fort);
    const pipeline = new DefaultSystemPipeline({
      invariants: new DefaultInvariantRunner({
        debug: TEST_DEBUG_CONFIG,
        logger,
        curves: PROGRESSION.curves,
        phaseOrder: MATCH_PHASES,
        terminalPhases: TERMINAL_MATCH_PHASES,
      }),
      state,
      progression: PROGRESSION,
      director: IDLE_DIRECTOR,
      hordes: { factory, space, decide: [] },
    });
    // The tower falls before any chase; the grid still blocks the court (the rift, x 50..70).
    state.entities.remove(fort.id, 'died');
    state.advanceTick();
    const minion = factory.create('light-mob', 'light-minion', {
      team: 'light',
      position: { x: 45, y: 20 },
    });
    const enemy = factory.create('light-mob', 'light-minion', {
      team: 'dark',
      position: { x: 58, y: 20 },
    });
    state.entities.add(minion);
    state.entities.add(enemy);
    state.hordes.add({
      id: 'horde-1',
      team: 'light',
      weightClass: 'light',
      lane: 'lane-0',
      formationId: 'ranks',
      memberIds: [minion.id],
      progress: 45,
    });
    state.hordes.add({
      id: 'horde-2',
      team: 'dark',
      weightClass: 'light',
      lane: 'lane-0',
      formationId: 'ranks',
      memberIds: [enemy.id],
      progress: 40,
    });
    state.entities.setAttackTarget(minion.id, enemy.id);

    pipeline.run({ state, logger });

    // Inside the fort's box the chase closes in over the court's blocked ground (owner 2026-11-04).
    expect(minion.getComponent(Movement).heading).toEqual({ x: 1, y: 0 });
  });
});
