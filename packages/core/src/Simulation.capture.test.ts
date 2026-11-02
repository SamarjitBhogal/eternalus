import { describe, expect, it } from 'vitest';

import { createDefaultGameConfig } from './config/defaultGameConfig';
import { TEST_DEBUG_CONFIG } from './diagnostics/InvariantRunner.constants';
import { MemoryLogger } from './diagnostics/MemoryLogger';
import { MapGenerator } from './map/MapGenerator';
import { Simulation } from './Simulation';
import type { EntitySnapshot } from './state/Snapshot.types';

const CONFIG = createDefaultGameConfig({ match: { countdownSeconds: 600 } });
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
  it('spawns one neutral capture point per capture-point and Cathedral feature of the map', () => {
    const features = MAP.features.filter(
      ({ kind }) => kind === 'capture-point' || kind === 'cathedral',
    );
    const zones = zonesOf(match());

    expect(features).toHaveLength(CONFIG.map.numLanes);
    expect(
      zones.map(({ definitionId, transform, team, capture }) => ({
        definitionId,
        at: transform && { x: transform.x, y: transform.y },
        team,
        capture,
      })),
    ).toEqual(
      features.map(({ kind, position }) => ({
        definitionId: kind === 'cathedral' ? 'cathedral-capture-point' : 'capture-point',
        at: position,
        team: 'neutral',
        capture: { owner: 'neutral', progress: 0, checkpoint: 0, checkpoints: 3, lockedBy: null },
      })),
    );
  });

  it('has no capture points without a map', () => {
    expect(zonesOf(match(false))).toEqual([]);
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
