import type { MapDefinition } from '../content/maps/maps.types';
import { deepFreeze } from './deepFreeze';
import { MapBuilder } from './MapBuilder';
import { MAP_GENERATOR_DEFAULTS } from './MapGenerator.constants';
import { MapGenerationError } from './MapGenerationError';
import type { MapGeneratorConfig, MapGeneratorDeps } from './MapGenerator.types';
import { validateMapConfig } from './validateMapConfig';
import { validateMapDefinition } from './validateMapDefinition';

/**
 * Turns `GameConfig.map` and a seed into a `MapDefinition` (ADR 0009). Pure and deterministic:
 * the same config and seed always give a deep-equal map, with no `Math.random` and no clock,
 * so it runs the same in tests, in the client and in a Worker. Counts come from the config;
 * layout tuning from content; a preset may only shape the ground and bend the lanes.
 */
export class MapGenerator {
  private readonly deps: MapGeneratorDeps;

  /** Creates a generator; pass `deps` to swap content, the RNG or the lane shape in tests. */
  public constructor(deps: Partial<MapGeneratorDeps> = {}) {
    this.deps = { ...MAP_GENERATOR_DEFAULTS, ...deps };
  }

  /**
   * Generates a frozen map. Throws `MapGenerationError` naming the rule when the config is
   * invalid, the preset is unknown, or the preset's ground does not fit the configured lanes.
   */
  public generate(config: MapGeneratorConfig, seed: number): MapDefinition {
    validateMapConfig(config.map);
    const { presetId } = config.map;
    const preset = presetId === undefined ? undefined : this.deps.presets[presetId];
    if (presetId !== undefined && preset === undefined) {
      throw new MapGenerationError(`Unknown map preset '${presetId}' (map.presetId)`);
    }
    const map = new MapBuilder({
      config: config.map,
      seed,
      layout: this.deps.layout,
      definitions: this.deps.definitions,
      preset,
      laneShape: this.deps.createLaneShape(preset?.laneProfile ?? this.deps.layout.laneProfile),
      rng: this.deps.createRng(seed),
    })
      .placeStrongholds()
      .layLanes()
      .placeLaneStructures()
      .raiseWalls()
      .placeCamps()
      .placeCapturePoints()
      .carveRiftAndBounds()
      .scatterObstacles()
      .build();
    validateMapDefinition(map);
    return deepFreeze(map);
  }
}
