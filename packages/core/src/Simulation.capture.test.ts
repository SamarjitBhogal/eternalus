import { describe, expect, it } from 'vitest';

import { createDefaultGameConfig } from './config/defaultGameConfig';
import { TEST_DEBUG_CONFIG } from './diagnostics/InvariantRunner.constants';
import { MemoryLogger } from './diagnostics/MemoryLogger';
import { MapGenerator } from './map/MapGenerator';
import { MapObjectBuilder } from './map/MapObjectBuilder';
import { MapPresentationBuilder } from './map/MapPresentationBuilder';
import { zoneAreaOf } from './map/zoneArea';
import { Simulation } from './Simulation';
import type { EntitySnapshot } from './state/Snapshot.types';

// The long countdown keeps the waves away. The timeline must stay in tick order, so the planned
// length puts the quarter mark (a quarter of it) after the countdown.
const CONFIG = createDefaultGameConfig({
  match: { countdownSeconds: 600, plannedMatchSeconds: 3600 },
});
const MAP = new MapGenerator().generate(CONFIG, 1);

const match = (withMap = true) =>
  new Simulation({
    config: CONFIG,
    seed: 1,
    logger: new MemoryLogger(),
    debug: TEST_DEBUG_CONFIG,
    ...(withMap ? { map: MAP } : {}),
  });

const zonesOf = (simulation: Simulation): EntitySnapshot[] =>
  simulation.snapshot().entities.filter(({ kind }) => kind === 'capture-point');

describe('Simulation capture points', () => {
  it('spawns one neutral capture point per capture-point and Cathedral feature, over its floor', () => {
    const features = MAP.features.filter(
      ({ kind }) => kind === 'capture-point' || kind === 'cathedral',
    );
    const zones = zonesOf(match());

    expect(features).toHaveLength(CONFIG.map.numLanes);
    expect(
      zones.map(({ definitionId, transform, team, area, capture }) => ({
        definitionId,
        at: transform && { x: transform.x, y: transform.y },
        team,
        area,
        capture,
      })),
    ).toEqual(
      features.map((feature) => ({
        definitionId: feature.kind === 'cathedral' ? 'cathedral-capture-point' : 'capture-point',
        at: feature.position,
        team: 'neutral',
        area: zoneAreaOf(MAP, feature),
        capture: {
          owner: 'neutral',
          progress: 0,
          checkpoint: 0,
          checkpoints: 3,
          lockedBy: null,
          presence: { light: 0, dark: 0, neutral: 0 },
        },
      })),
    );
  });

  it('counts a Legend anywhere on its building floor, with map objects on as the game ships (DEC-145)', () => {
    const objects = new MapObjectBuilder().build(MAP, new MapPresentationBuilder().build(MAP));
    const simulation = new Simulation({
      config: CONFIG,
      seed: 1,
      logger: new MemoryLogger(),
      debug: TEST_DEBUG_CONFIG,
      map: MAP,
      mapObjects: objects,
    });
    const cathedral = MAP.features.find(({ kind }) => kind === 'cathedral')?.position;
    const fort = MAP.features.find(({ kind }) => kind === 'capture-point')?.position;
    // The map is sketch-sized (scale 1). Both spots are off the old radius-35 circle: the west
    // chapel 84 from the Cathedral's centre, a court corner 36 from the fort's, clear of its keep.
    const spots = [
      { team: 'dark', at: { x: (cathedral?.x ?? 0) - 84, y: (cathedral?.y ?? 0) + 5 } },
      { team: 'light', at: { x: (fort?.x ?? 0) + 24, y: (fort?.y ?? 0) + 27 } },
    ] as const;
    for (const { team, at } of spots) {
      simulation.enqueueCommand({
        type: 'dev-spawn',
        kind: 'warrior',
        definitionId: 'warrior',
        team,
        at,
        count: 1,
      });
    }
    for (let tick = 0; tick < 125; tick += 1) {
      simulation.step();
    }

    const ownerAt = (point: { x: number; y: number } | undefined) =>
      zonesOf(simulation).find(
        ({ transform }) => transform?.x === point?.x && transform?.y === point?.y,
      )?.capture?.owner;
    expect([ownerAt(cathedral), ownerAt(fort)]).toEqual(['dark', 'light']);
  });

  it('links each capture point to its feature, the same way every run (DEC-231)', () => {
    const features = MAP.features.filter(
      ({ kind }) => kind === 'capture-point' || kind === 'cathedral',
    );
    const play = () => {
      const simulation = match();
      simulation.enqueueCommand({
        type: 'dev-spawn',
        kind: 'warrior',
        definitionId: 'warrior',
        team: 'light',
        at: features[0]?.position ?? { x: 0, y: 0 },
        count: 1,
      });
      for (let tick = 0; tick < 30; tick += 1) {
        simulation.step();
      }
      return simulation;
    };
    const linksOf = (simulation: Simulation) =>
      zonesOf(simulation).map(({ id, mapFeatureId }) => ({ id, mapFeatureId }));
    const first = play();
    const second = play();

    expect(zonesOf(first).map(({ mapFeatureId }) => mapFeatureId)).toEqual(
      features.map(({ id }) => id),
    );
    expect(linksOf(second)).toEqual(linksOf(first));
    expect(second.hash()).toBe(first.hash());
  });

  it('has no capture points without a map', () => {
    expect(zonesOf(match(false))).toEqual([]);
  });

  it('refuses a developer spawn of a capture point: only the map places one', () => {
    const simulation = match();
    const rejected: string[] = [];
    simulation.on('command-rejected', ({ reason }) => rejected.push(reason));
    simulation.enqueueCommand({
      type: 'dev-spawn',
      kind: 'capture-point',
      definitionId: 'capture-point',
      team: 'light',
      at: { x: 0, y: 0 },
      count: 1,
    });

    simulation.step();

    expect(rejected).toEqual(['map-only']);
    expect(zonesOf(simulation)).toHaveLength(CONFIG.map.numLanes);
  });

  it('captures the Cathedral for the team whose Legend stands in it, the same way every run', () => {
    const cathedral = MAP.features.find(({ kind }) => kind === 'cathedral');
    const play = () => {
      const simulation = match();
      simulation.enqueueCommand({
        type: 'dev-spawn',
        kind: 'warrior',
        definitionId: 'warrior',
        team: 'dark',
        at: cathedral?.position ?? { x: 0, y: 0 },
        count: 1,
      });
      for (let tick = 0; tick < 125; tick += 1) {
        simulation.step();
      }
      return simulation;
    };
    const first = play();
    const zone = zonesOf(first).find(
      ({ definitionId }) => definitionId === 'cathedral-capture-point',
    );

    expect(zone?.capture).toMatchObject({ owner: 'dark', progress: -1, checkpoint: 3 });
    expect(play().hash()).toBe(first.hash());
  });
});
