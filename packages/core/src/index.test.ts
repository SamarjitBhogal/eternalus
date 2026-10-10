import { describe, expect, it } from 'vitest';

import * as core from './index';

describe('@eternalus/core public API', () => {
  it('exports exactly the documented runtime values', () => {
    expect(Object.keys(core).sort()).toEqual([
      'CathedralInteriorBuilder',
      'ConfigValidationError',
      'DEFAULT_MAP_CONFIG',
      'MapGenerator',
      'MapLayout',
      'MapSceneryBuilder',
      'MemoryLogger',
      'NullLogger',
      'SEVERITY',
      'SeededRandom',
      'Simulation',
      'StateHasher',
      'createDefaultGameConfig',
      'makeLogRecord',
      'runReplay',
      'validateGameConfig',
    ]);
  });

  it('generates the default map-1 from the default config', () => {
    const map = new core.MapGenerator().generate({ map: core.DEFAULT_MAP_CONFIG }, 1);

    expect(map.id).toBe('map-1');
    expect(map.lanes).toHaveLength(core.DEFAULT_MAP_CONFIG.numLanes);
  });

  it('generates the same map from the default GameConfig as from the map stand-in', () => {
    const generator = new core.MapGenerator();
    expect(generator.generate(core.createDefaultGameConfig(), 1)).toEqual(
      generator.generate({ map: core.DEFAULT_MAP_CONFIG }, 1),
    );
  });

  it('runs a simulation from the default config', () => {
    const sim = new core.Simulation({
      config: core.createDefaultGameConfig(),
      seed: 1,
      logger: new core.NullLogger(),
    });
    sim.step();
    expect(sim.snapshot()).toEqual({ tick: 1, phase: 'countdown', entities: [] });
  });

  it('builds a default config that passes validation', () => {
    expect(core.validateGameConfig(core.createDefaultGameConfig()).tickRate).toBe(30);
  });
});
