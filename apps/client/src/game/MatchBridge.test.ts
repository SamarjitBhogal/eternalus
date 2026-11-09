import {
  createDefaultGameConfig,
  type EntitySnapshot,
  type GameEventHandler,
  type GameEventMap,
  type GameEventType,
  type MapFeature,
  type MapFeatureKind,
  type Simulation,
  type Snapshot,
  type Team,
  type Unsubscribe,
} from '@eternalus/core';
import { describe, expect, it } from 'vitest';

import { matchResultFixture } from '../bridge/__fixtures__/matchResultFixtures';
import type { BridgeEventMap } from '../bridge/events';
import { TypedEventBus } from '../bridge/TypedEventBus';
import { MatchBridge } from './MatchBridge';
import { HUD_PUBLISH_EVERY_TICKS } from './MatchBridge.constants';
import { prepareMatchWorld } from './prepareMatchWorld';

const CAPTURE_KINDS: readonly MapFeatureKind[] = ['capture-point', 'cathedral'];
const PLAYER: EntitySnapshot = {
  id: 'player-1',
  kind: 'magus',
  family: 'legend',
  definitionId: 'magus',
  team: 'light',
  transform: { x: 1, y: 2, radius: 0.5 },
  health: { current: 600, max: 600 },
  area: null,
  capture: null,
};

/** The simulation's side of the bridge's listener table: who listens to what, and a way to emit. */
class FakeSimulationEvents implements Pick<Simulation, 'on'> {
  private readonly handlers = new Map<GameEventType, GameEventHandler<never>[]>();

  public on<K extends GameEventType>(type: K, handler: GameEventHandler<K>): Unsubscribe {
    this.handlers.set(type, [...this.listenersOf(type), handler]);
    return () => {
      this.handlers.set(
        type,
        this.listenersOf(type).filter((candidate) => candidate !== handler),
      );
    };
  }

  public emit<K extends GameEventType>(type: K, payload: GameEventMap[K]): void {
    for (const handler of this.listenersOf(type)) (handler as GameEventHandler<K>)(payload);
  }

  /** How many handlers listen across every event type. */
  public get listenerCount(): number {
    return [...this.handlers.values()].reduce((sum, list) => sum + list.length, 0);
  }

  private listenersOf(type: GameEventType): readonly GameEventHandler<never>[] {
    return this.handlers.get(type) ?? [];
  }
}

const snapshotAt = (tick: number, entities: readonly EntitySnapshot[] = []): Snapshot => ({
  tick,
  match: { phase: 'early-game', phaseEnteredTick: 0, upcoming: [], humanLegendId: null },
  entities,
  hordes: [],
  teams: {
    light: { unitsRequested: 0, unitsSuppressed: 0, towersLostByLane: {} },
    dark: { unitsRequested: 0, unitsSuppressed: 0, towersLostByLane: {} },
  },
});

/** A capture zone standing at `at`, naming `mapFeatureId` when given, held by `owner`. */
const zoneSnapshot = (
  at: { readonly x: number; readonly y: number },
  owner: Team,
  progress: number,
  mapFeatureId?: string,
): EntitySnapshot => ({
  id: 'zone-1',
  kind: 'capture-point',
  family: 'zone',
  definitionId: 'capture-point',
  team: 'neutral',
  transform: { ...at, radius: 0 },
  health: null,
  area: [],
  capture: {
    owner,
    progress,
    checkpoint: 0,
    checkpoints: 3,
    lockedBy: null,
    presence: { light: 0, dark: 0, neutral: 0 },
  },
  ...(mapFeatureId !== undefined && { mapFeatureId }),
});

/** The structure core built from `feature`, with `current` of `max` health. */
const structureOf = (feature: MapFeature, current: number, max: number): EntitySnapshot => ({
  id: `structure-${feature.id}`,
  kind: feature.kind,
  family: 'structure',
  definitionId: feature.definitionId,
  team: feature.team,
  transform: { ...feature.position, radius: 3 },
  health: { current, max },
  area: null,
  capture: null,
  mapFeatureId: feature.id,
});

const MAP = prepareMatchWorld(createDefaultGameConfig(), 1).map;
/** The first light feature of `kind` on the shipped map. */
const lightFeature = (kind: MapFeatureKind): MapFeature => {
  const feature = MAP.features.find(
    (candidate) => candidate.kind === kind && candidate.team === 'light',
  );
  if (feature === undefined) throw new Error(`The map has no light ${kind}.`);
  return feature;
};

function setUp(
  numLanes = createDefaultGameConfig().map.numLanes,
  firstSnapshot: Snapshot = snapshotAt(0),
) {
  const defaults = createDefaultGameConfig();
  const { map } = prepareMatchWorld({ map: { ...defaults.map, numLanes } }, 1);
  const bus = new TypedEventBus<BridgeEventMap>();
  const order: (keyof BridgeEventMap)[] = [];
  const clocks: BridgeEventMap['match-clock'][] = [];
  const huds: BridgeEventMap['hud-state'][] = [];
  const structures: BridgeEventMap['structure-state'][] = [];
  const captures: BridgeEventMap['capture-state'][] = [];
  bus.on('match-clock', (event) => {
    order.push('match-clock');
    clocks.push(event);
  });
  bus.on('hud-state', (event) => {
    order.push('hud-state');
    huds.push(event);
  });
  bus.on('structure-state', (event) => {
    order.push('structure-state');
    structures.push(event);
  });
  bus.on('capture-state', (event) => {
    order.push('capture-state');
    captures.push(event);
  });
  const endings: BridgeEventMap['match-ended'][] = [];
  bus.on('match-ended', (event) => {
    order.push('match-ended');
    endings.push(event);
  });
  const simulation = new FakeSimulationEvents();
  const bridge = new MatchBridge({
    bus,
    publishEveryTicks: HUD_PUBLISH_EVERY_TICKS,
    tickRate: defaults.tickRate,
    map,
    captureKinds: CAPTURE_KINDS,
    events: simulation,
    firstSnapshot,
  });
  return { map, bridge, order, clocks, huds, structures, captures, endings, simulation };
}

describe('MatchBridge', () => {
  it('publishes the clock and HUD every 6 ticks and the rosters every 30', () => {
    const { bridge, clocks, huds, structures, captures } = setUp();
    for (let tick = 1; tick <= 30; tick += 1) bridge.afterTick(snapshotAt(tick), null);

    expect(clocks.map((clock) => clock.tick)).toEqual([6, 12, 18, 24, 30]);
    expect(clocks[0]?.seconds).toBeCloseTo(6 / 30);
    expect(huds).toHaveLength(5);
    expect(structures).toHaveLength(1);
    expect(captures).toHaveLength(1);
  });

  it('publishes everything once at match start: rosters, the clock at 0 and no player yet', () => {
    const { bridge, order, clocks, huds } = setUp();
    bridge.publishAll(snapshotAt(0), null);

    expect(order).toEqual(['structure-state', 'capture-state', 'match-clock', 'hud-state']);
    expect(clocks).toEqual([{ tick: 0, seconds: 0 }]);
    expect(huds).toEqual([{ player: null }]);
  });

  it("carries only the player's health; every other HUD value stays empty", () => {
    const { bridge, huds } = setUp();
    bridge.publishAll(snapshotAt(0, [PLAYER]), 'player-1');
    bridge.publishAll(snapshotAt(0, [PLAYER]), 'someone-else');

    expect(huds).toEqual([
      {
        player: {
          entityId: 'player-1',
          definitionId: 'magus',
          health: 600,
          maxHealth: 600,
          aether: null,
          maxAether: null,
          level: null,
          xp: null,
          xpToNext: null,
          weaponProgress: null,
          ultimatePips: null,
          slots: [],
        },
      },
      { player: null },
    ]);
  });

  it('lists every team feature once as a structure, with its lane and, with no structure built, no health', () => {
    const { map, bridge, structures: published } = setUp();
    bridge.publishAll(snapshotAt(0), null);
    const structures = published[0]?.structures ?? [];
    const teamFeatures = map.features.filter((feature) => feature.team !== 'neutral');

    expect(structures.map((structure) => structure.structureId)).toEqual(
      teamFeatures.map((feature) => feature.id),
    );
    for (const structure of structures) {
      const feature = map.features.find((candidate) => candidate.id === structure.structureId);
      const lane = map.lanes.find((candidate) => candidate.id === feature?.laneId);
      expect(structure).toEqual({
        structureId: feature?.id,
        kind: feature?.kind,
        team: feature?.team,
        laneIndex: lane?.index ?? null,
        health: null,
      });
    }
  });

  it('lists the capture kinds as neutral capture points with no progress', () => {
    const { map, bridge, captures } = setUp();
    bridge.publishAll(snapshotAt(0), null);
    const points = captures[0]?.points ?? [];

    expect(points.map((point) => point.pointId)).toEqual(
      map.features.filter((feature) => CAPTURE_KINDS.includes(feature.kind)).map((f) => f.id),
    );
    expect(points.map((point) => point.laneIndex)).toEqual([0, 1, 2]);
    for (const point of points) {
      expect(point).toMatchObject({ ownerTeam: 'neutral', progress: null });
    }
  });

  it("publishes each capture point's owner and progress from the zone of its feature, or none without one", () => {
    const { map, bridge, captures } = setUp();
    const [first, second] = map.features.filter((feature) => CAPTURE_KINDS.includes(feature.kind));
    if (first === undefined || second === undefined) {
      throw new Error('The map needs two capture features.');
    }
    const zoneOn = (owner: Team, progress: number): EntitySnapshot =>
      zoneSnapshot(first.position, owner, progress, first.id);
    bridge.publishAll(snapshotAt(0, [PLAYER, zoneOn('light', 0.5)]), null);
    bridge.afterTick(snapshotAt(30, [PLAYER, zoneOn('light', 0.5)]), null);
    bridge.afterTick(snapshotAt(60, [PLAYER, zoneOn('dark', -1)]), null);
    bridge.afterTick(snapshotAt(90, [PLAYER]), null);
    const [atStart, unchanged, later, zoneGone] = captures.map((event) => event.points);

    expect(atStart?.[0]).toMatchObject({ pointId: first.id, ownerTeam: 'light', progress: 0.5 });
    expect(atStart?.[1]).toMatchObject({
      pointId: second.id,
      ownerTeam: 'neutral',
      progress: null,
    });
    expect(unchanged).toBe(atStart);
    expect(later?.[0]).toMatchObject({ pointId: first.id, ownerTeam: 'dark', progress: -1 });
    expect(later?.[1]).toBe(atStart?.[1]);
    expect(zoneGone?.[1]).toBe(atStart?.[1]);
    expect(zoneGone?.[0]).toMatchObject({
      pointId: first.id,
      ownerTeam: 'neutral',
      progress: null,
    });
  });

  it('binds a capture point to the zone that names its feature, never to one on its position (DEC-231)', () => {
    const { map, bridge, captures } = setUp();
    const [first, second] = map.features.filter((feature) => CAPTURE_KINDS.includes(feature.kind));
    if (first === undefined || second === undefined) {
      throw new Error('The map needs two capture features.');
    }
    // The first point's zone stands on the second point's spot; nothing names the second.
    const moved = zoneSnapshot(second.position, 'dark', -0.25, first.id);
    const unnamed = { ...zoneSnapshot(second.position, 'light', 1), id: 'zone-2' };
    bridge.publishAll(snapshotAt(0, [moved, unnamed]), null);
    const points = captures[0]?.points ?? [];

    expect(points.find(({ pointId }) => pointId === first.id)).toMatchObject({
      ownerTeam: 'dark',
      progress: -0.25,
    });
    expect(points.find(({ pointId }) => pointId === second.id)).toMatchObject({
      ownerTeam: 'neutral',
      progress: null,
    });
  });

  it('follows the lane count of the config', () => {
    const { bridge, structures: published, captures } = setUp(5);
    bridge.publishAll(snapshotAt(0), null);
    const structures = published[0]?.structures ?? [];
    const count = (kind: MapFeatureKind, team: 'light' | 'dark'): number =>
      structures.filter((structure) => structure.kind === kind && structure.team === team).length;

    expect(captures[0]?.points).toHaveLength(5);
    for (const team of ['light', 'dark'] as const) {
      expect(count('spawner-tower', team)).toBe(5);
      expect(count('buff-tower', team)).toBe(5);
    }
  });

  it('re-sends the same roster arrays, so the store sees no change', () => {
    const { bridge, structures, captures } = setUp();
    bridge.publishAll(snapshotAt(0), null);
    bridge.afterTick(snapshotAt(30), null);

    const [first, second] = structures;
    const [firstPoints, secondPoints] = captures;
    expect(second?.structures).toBe(first?.structures);
    expect(secondPoints?.points).toBe(firstPoints?.points);
  });

  it('re-sends the same structure array while no health changed, and keeps each unchanged tile (DEC-221)', () => {
    const stronghold = lightFeature('stronghold');
    const gate = lightFeature('gate');
    const atFull = [structureOf(stronghold, 10_000, 10_000), structureOf(gate, 3_000, 3_000)];
    const start = snapshotAt(0, atFull);
    const { bridge, structures: published } = setUp(undefined, start);
    bridge.publishAll(start, null);
    bridge.afterTick(snapshotAt(30, atFull), null);
    bridge.afterTick(
      snapshotAt(60, [structureOf(stronghold, 10_000, 10_000), structureOf(gate, 1_200, 3_000)]),
      null,
    );
    bridge.afterTick(
      snapshotAt(90, [structureOf(stronghold, 10_000, 12_000), structureOf(gate, 1_200, 3_000)]),
      null,
    );
    const tileOf = (index: number, id: string) =>
      published[index]?.structures.find(({ structureId }) => structureId === id);

    expect(published[1]?.structures).toBe(published[0]?.structures);
    expect(published[2]?.structures).not.toBe(published[1]?.structures);
    expect(tileOf(2, stronghold.id)).toBe(tileOf(1, stronghold.id));
    expect(tileOf(2, gate.id)?.health).toEqual({ current: 1_200, max: 3_000 });
    expect(tileOf(3, stronghold.id)?.health).toEqual({ current: 10_000, max: 12_000 });
    expect(tileOf(3, gate.id)).toBe(tileOf(2, gate.id));
  });

  it("gives each structure tile its live structure's health, bound by feature id (DEC-212)", () => {
    const stronghold = lightFeature('stronghold');
    const gate = lightFeature('gate');
    const start = snapshotAt(0, [
      structureOf(stronghold, 10_000, 10_000),
      structureOf(gate, 3_000, 3_000),
    ]);
    const { bridge, structures: published } = setUp(undefined, start);
    bridge.publishAll(start, null);
    bridge.afterTick(
      snapshotAt(30, [structureOf(stronghold, 7_500, 10_000), structureOf(gate, 1_200, 3_000)]),
      null,
    );
    const healthOf = (index: number, id: string) =>
      published[index]?.structures.find(({ structureId }) => structureId === id)?.health;

    expect([healthOf(0, stronghold.id), healthOf(0, gate.id)]).toEqual([
      { current: 10_000, max: 10_000 },
      { current: 3_000, max: 3_000 },
    ]);
    expect([healthOf(1, stronghold.id), healthOf(1, gate.id)]).toEqual([
      { current: 7_500, max: 10_000 },
      { current: 1_200, max: 3_000 },
    ]);
  });

  it('shows a structure at 0 once it is destroyed and gone from the snapshot (DEC-69)', () => {
    const tower = lightFeature('buff-tower');
    const start = snapshotAt(0, [structureOf(tower, 2_500, 2_500)]);
    const { bridge, structures: published } = setUp(undefined, start);
    bridge.afterTick(snapshotAt(30), null);

    expect(
      published[0]?.structures.find(({ structureId }) => structureId === tower.id)?.health,
    ).toEqual({ current: 0, max: 2_500 });
  });

  it('keeps null for a feature core built no structure for, and never binds by position', () => {
    const wall = lightFeature('wall-segment');
    const tower = lightFeature('spawner-tower');
    // An entity standing on the tower's spot that names no feature is not the tower's structure.
    const bystander: EntitySnapshot = {
      id: 'bystander',
      kind: tower.kind,
      family: 'structure',
      definitionId: tower.definitionId,
      team: tower.team,
      transform: { ...tower.position, radius: 3 },
      health: { current: 1, max: 3_000 },
      area: null,
      capture: null,
    };
    const start = snapshotAt(0, [bystander]);
    const { bridge, structures: published } = setUp(undefined, start);
    bridge.publishAll(start, null);
    const healthOf = (id: string) =>
      published[0]?.structures.find(({ structureId }) => structureId === id)?.health;

    expect(healthOf(wall.id)).toBeNull();
    expect(healthOf(tower.id)).toBeNull();
  });

  it("publishes match-ended once, after the ending tick's other events, with its length", () => {
    const { bridge, order, endings, simulation } = setUp();
    const result = matchResultFixture({ durationTicks: 3600 });
    expect(bridge.afterTick(snapshotAt(5), null)).toBe(false);

    simulation.emit('match-ended', { result });
    expect(endings).toEqual([]);
    expect(bridge.afterTick(snapshotAt(6), null)).toBe(true);
    expect(bridge.afterTick(snapshotAt(7), null)).toBe(false);
    simulation.emit('match-ended', { result });
    expect(bridge.afterTick(snapshotAt(8), null)).toBe(false);

    expect(endings).toEqual([{ result, durationSeconds: 120 }]);
    expect(order.slice(-3)).toEqual(['match-clock', 'hud-state', 'match-ended']);
  });

  it('unsubscribes its whole listener table on destroy; a later end is never latched', () => {
    const { bridge, simulation, endings } = setUp();
    expect(simulation.listenerCount).toBe(1);
    bridge.destroy();
    expect(simulation.listenerCount).toBe(0);

    simulation.emit('match-ended', { result: matchResultFixture() });
    expect(bridge.afterTick(snapshotAt(6), null)).toBe(false);
    expect(endings).toEqual([]);
  });
});
