import { describe, expect, it } from 'vitest';

import { LEGEND_SPECS } from './content/legends/specs/legendSpecCatalogue';
import * as core from './index';

describe('@eternalus/core public API', () => {
  it('exports exactly the documented runtime values', () => {
    expect(Object.keys(core).sort()).toEqual([
      'CathedralInteriorBuilder',
      'ConfigValidationError',
      'DEFAULT_MAP_CONFIG',
      'MapGenerator',
      'MapSceneryBuilder',
      'MemoryLogger',
      'NullLogger',
      'SEVERITY',
      'SeededRandom',
      'Simulation',
      'StateHasher',
      'createDefaultGameConfig',
      'loadDisplayContent',
      'makeLogRecord',
      'runReplay',
      'validateGameConfig',
    ]);
  });

  it('keeps the raw content catalogues internal: display content comes from loadDisplayContent', () => {
    expect(Object.keys(core)).not.toContain('LEGEND_CLASSES');
    expect(Object.keys(core)).not.toContain('LEGEND_SPECS');
    expect(core.loadDisplayContent().specs).toEqual(LEGEND_SPECS.all());
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
    expect(sim.snapshot()).toEqual({
      tick: 1,
      match: {
        phase: 'countdown',
        phaseEnteredTick: 0,
        upcoming: [
          { entryId: 'countdown-over', tick: 300 },
          { entryId: 'quarter-mark', tick: 13_500 },
          { entryId: 'mid-game', tick: 27_000 },
          { entryId: 'end-game', tick: 40_500 },
        ],
        humanLegendId: null,
      },
      entities: [],
    });
  });

  it('builds a default config that passes validation', () => {
    expect(core.validateGameConfig(core.createDefaultGameConfig()).tickRate).toBe(30);
  });
});
