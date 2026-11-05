import { afterEach, describe, expect, it, vi } from 'vitest';

import { TEST_DEBUG_CONFIG } from '../diagnostics/InvariantRunner.constants';

import { DamagePipeline } from '../combat/DamagePipeline';
import { Footprint } from '../components/Footprint';
import { Health } from '../components/Health';
import { Movement } from '../components/Movement';
import { Progression } from '../components/Progression';
import { createDefaultGameConfig } from '../config/defaultGameConfig';
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
import { Transform } from '../components/Transform';
import { Entity } from '../entities/Entity';
import { BLOCKED_LANE_MAP } from '../map/__fixtures__/blockedLaneMap';
import { SystemPipeline } from './SystemPipeline';
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

/** A tower stand-in whose fort walls (x 50..52 and 68..70, y 10..30) give a box round the rift. */
class Fort extends Entity {
  public readonly kind = 'spawner-tower';
  public readonly family = 'structure';
  protected installComponents(): void {
    const wall = (x0: number, x1: number) => [
      { x: x0, y: 10 },
      { x: x1, y: 10 },
      { x: x1, y: 30 },
      { x: x0, y: 30 },
    ];
    this.addComponent(new Transform({ x: 60, y: 20 }, 14));
    this.addComponent(new Footprint([wall(50, 52), wall(68, 70)]));
  }
}

describe('DefaultSystemPipeline', () => {
  it('moves, then removes the dead, then checks invariants, in that order', () => {
    const logger = new MemoryLogger();
    const state = new GameState(createDefaultGameConfig(), 1);
    const pipeline = new DefaultSystemPipeline(
      new DefaultInvariantRunner(TEST_DEBUG_CONFIG, logger, PROGRESSION.curves),
      state,
      PROGRESSION,
    );
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

    const pipeline = new DefaultSystemPipeline(
      new DefaultInvariantRunner(TEST_DEBUG_CONFIG, logger, PROGRESSION.curves),
      state,
      PROGRESSION,
      {
        factory,
        space,
        decide: [{ name: 'ai', update: () => undefined }],
        collisions: [{ name: 'collision', update: () => undefined }],
      },
    );

    // Collision resolves positions before the index, steering, combat and next tick's AI read them.
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
      'invariants',
    ]);
  });

  it('lands attacks after movement and before death, so a unit killed this tick leaves this tick', () => {
    const logger = new MemoryLogger();
    const state = new GameState(createDefaultGameConfig(), 1);
    const pipeline = new DefaultSystemPipeline(
      new DefaultInvariantRunner(TEST_DEBUG_CONFIG, logger, PROGRESSION.curves),
      state,
      PROGRESSION,
    );
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

  it('pays a combat kill in the same tick, before the dead are removed', () => {
    const logger = new MemoryLogger();
    const state = new GameState(createDefaultGameConfig(), 1);
    const pipeline = new DefaultSystemPipeline(
      new DefaultInvariantRunner(TEST_DEBUG_CONFIG, logger, PROGRESSION.curves),
      state,
      PROGRESSION,
    );
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
    const pipeline = new DefaultSystemPipeline(
      new DefaultInvariantRunner(TEST_DEBUG_CONFIG, logger, PROGRESSION.curves),
      state,
      PROGRESSION,
    );
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
      { entityId: warrior.id, amount: 20, victimId: minion.id, victimTeam: 'dark' },
    ]);
    expect(state.entities.has(warrior.id)).toBe(false);
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
      const pipeline = new DefaultSystemPipeline(
        new DefaultInvariantRunner(TEST_DEBUG_CONFIG, new MemoryLogger(), PROGRESSION.curves),
        state,
        PROGRESSION,
        hasLanes ? { factory, space: null, decide: [] } : undefined,
      );
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
  it.each([
    // A tower's fort box is one (DEC-185); the chase closes in over the court's blocked ground.
    { definitionId: 'spawner-tower', heading: { x: 1, y: 0 } },
    // A gate's footprint is only its outline for reach (DEC-217 (17)), not a fort box: the chase
    // holds at the blocked ground.
    { definitionId: 'gate', heading: { x: 0, y: 0 } },
  ])(
    'gives steering the fort boxes of the structures standing when it is built, so a fallen tower keeps its box ($definitionId)',
    ({ definitionId, heading }) => {
      const logger = new MemoryLogger();
      const space = new SpaceIndex(BLOCKED_LANE_MAP.width, BLOCKED_LANE_MAP.height, 2);
      const state = new GameState(createDefaultGameConfig(), 1, matchWorldOf(BLOCKED_LANE_MAP), {
        space,
      });
      const factory = newFactory();
      const fort = new Fort('fort', definitionId);
      fort.spawn(undefined);
      state.entities.add(fort);
      const pipeline = new DefaultSystemPipeline(
        new DefaultInvariantRunner(TEST_DEBUG_CONFIG, logger, PROGRESSION.curves),
        state,
        PROGRESSION,
        { factory, space, decide: [] },
      );
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
      expect(minion.getComponent(Movement).heading).toEqual(heading);
    },
  );
});
