import {
  DUEL_RULES,
  type GameConfig,
  type Logger,
  MapGenerator,
  MapObjectBuilder,
  MapPresentationBuilder,
  Simulation,
} from '@eternalus/core';
import { CoreDuelSimulation } from './CoreDuelSimulation';
import { DUEL_ROSTER } from './CoreDuelSimulationFactory.constants';
import type { DuelSimulation, DuelSimulationFactory } from './DuelSimulation.types';

/**
 * Builds each Duel's core `Simulation`: the generated map and map objects for a fresh seed (the
 * same steps as the client's `prepareMatchWorld`, which the server may not import) and the Duel
 * roster. Each client regenerates the same map from `match-found.seed` with the same core
 * generator and the default config, so the server and the clients agree on the arena (ADR 0016,
 * Consequences "Watch").
 */
export class CoreDuelSimulationFactory implements DuelSimulationFactory {
  /**
   * @param nextSeed Gives each match's seed, a whole number from 0 to 2^32 - 1.
   */
  public constructor(
    private readonly config: GameConfig,
    private readonly logger: Logger,
    private readonly nextSeed: () => number,
  ) {}

  /** Builds a Duel; throws what `MapGenerator` or `Simulation` throws. */
  public create(): DuelSimulation {
    const { config, logger } = this;
    const seed = this.nextSeed();
    const map = new MapGenerator().generate(config, seed);
    const presentation = new MapPresentationBuilder().build(map);
    const mapObjects = new MapObjectBuilder().build(map, presentation);
    const simulation = new Simulation({
      config,
      seed,
      logger,
      map,
      mapObjects,
      roster: DUEL_ROSTER,
      duel: { killTarget: DUEL_RULES.killTarget },
    });
    return new CoreDuelSimulation(simulation, mapObjects, seed);
  }
}
