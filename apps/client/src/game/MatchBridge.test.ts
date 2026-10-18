import {
  createDefaultGameConfig,
  type EntitySnapshot,
  type MapFeatureKind,
  type Snapshot,
} from '@eternalus/core';
import { describe, expect, it } from 'vitest';

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
};

const snapshotAt = (tick: number, entities: readonly EntitySnapshot[] = []): Snapshot => ({
  tick,
  phase: 'early-game',
  entities,
});

function setUp(numLanes = createDefaultGameConfig().map.numLanes) {
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
  const bridge = new MatchBridge({
    bus,
    publishEveryTicks: HUD_PUBLISH_EVERY_TICKS,
    tickRate: defaults.tickRate,
    map,
    captureKinds: CAPTURE_KINDS,
  });
  return { map, bridge, order, clocks, huds, structures, captures };
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

  it('lists every team feature once as a structure, with its lane and no health', () => {
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
});
