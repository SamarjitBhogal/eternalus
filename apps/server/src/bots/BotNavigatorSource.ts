import {
  createDefaultGameConfig,
  MapGenerator,
  MapObjectBuilder,
  MapPresentationBuilder,
  MatchPathfinderFactory,
} from '@eternalus/core';
import { BotNavigator } from './BotNavigator';

/**
 * Gives a bot the navigator for a match: regenerates the arena from the match's seed exactly as
 * the server does (default config, same core generator; see `CoreDuelSimulationFactory`) and
 * builds the same walkability grid and A\* the simulation uses. One search state per seed, shared
 * by the bots of that match (they run on one thread, so searches never interleave).
 */
export class BotNavigatorSource {
  private readonly bySeed = new Map<number, BotNavigator>();

  /** The navigator for the map that `seed` generates. */
  public forSeed(seed: number): BotNavigator {
    const known = this.bySeed.get(seed);
    if (known !== undefined) {
      return known;
    }
    const config = createDefaultGameConfig();
    const map = new MapGenerator().generate(config, seed);
    const mapObjects = new MapObjectBuilder().build(map, new MapPresentationBuilder().build(map));
    const { paths } = new MatchPathfinderFactory().create(map, config, mapObjects);
    const navigator = new BotNavigator(paths);
    this.bySeed.set(seed, navigator);
    return navigator;
  }
}
