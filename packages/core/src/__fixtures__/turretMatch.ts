import { countdownTicks } from '../config/countdownTicks';
import { createDefaultGameConfig } from '../config/defaultGameConfig';
import type { MapFeature } from '../content/maps/maps.types';
import { STRUCTURE_DEFINITIONS } from '../content/structures/structureCatalogue';
import { TEST_DEBUG_CONFIG } from '../diagnostics/InvariantRunner.constants';
import { MemoryLogger } from '../diagnostics/MemoryLogger';
import { MapGenerator } from '../map/MapGenerator';
import { MapObjectBuilder } from '../map/MapObjectBuilder';
import { MapPresentationBuilder } from '../map/MapPresentationBuilder';
import { Simulation } from '../Simulation';
import type { SimulationOptions } from '../Simulation.types';
import type { GameState } from '../state/GameState';
import { cos, sin } from '../utils/deterministicMath';
import type { Vec2 } from '../utils/geometry.types';

/*
 * The match the wall turret scenario tests share (Simulation.turrets.test.ts and
 * Simulation.turretLaunch.test.ts): the seed 1 map with its map objects, the helpers that run it
 * and place units outside a turret.
 */

export const config = createDefaultGameConfig({ match: { countdownSeconds: 1 } });
export const MAP = new MapGenerator().generate(config, 1);
export const MAP_OBJECTS = new MapObjectBuilder().build(
  MAP,
  new MapPresentationBuilder().build(MAP),
);
export const TURRET_FEATURES = MAP.features.filter(({ kind }) => kind === 'turret');

/** A match on the generated map with its map objects; `state` is the simulation's own. */
export const setUp = (options: Partial<SimulationOptions> = {}) => {
  const logger = new MemoryLogger();
  const simulation = new Simulation({
    config,
    seed: 1,
    logger,
    debug: TEST_DEBUG_CONFIG,
    map: MAP,
    mapObjects: MAP_OBJECTS,
    ...options,
  });
  const { state } = simulation as unknown as { readonly state: GameState };
  const run = (ticks: number) => {
    for (let tick = 0; tick < ticks; tick += 1) {
      simulation.step();
    }
  };
  /** The turret structure built from `feature`. */
  const turretOf = (feature: MapFeature) =>
    simulation.snapshot().entities.find(({ mapFeatureId }) => mapFeatureId === feature.id);
  return { simulation, state, logger, run, turretOf };
};

/** The unit vector from `feature`'s team's Stronghold to `feature`, turned by `degrees`. */
export const outwardOf = (feature: MapFeature, degrees = 0): Vec2 => {
  const home = MAP.features.find(
    ({ kind, team }) => kind === 'stronghold' && team === feature.team,
  )?.position;
  const dx = feature.position.x - (home?.x ?? 0);
  const dy = feature.position.y - (home?.y ?? 0);
  const length = Math.hypot(dx, dy);
  const turn = (degrees * Math.PI) / 180;
  return {
    x: (dx * cos(turn) - dy * sin(turn)) / length,
    y: (dx * sin(turn) + dy * cos(turn)) / length,
  };
};

/**
 * A point `gap` metres outside `feature`'s pylon, away from its team's Stronghold, or turned
 * `degrees` from that line.
 */
export const outside = (feature: MapFeature, gap: number, degrees = 0): Vec2 => {
  const out = outwardOf(feature, degrees);
  const radius = STRUCTURE_DEFINITIONS.get('turret').footprintRadius;
  return {
    x: feature.position.x + out.x * (radius + gap),
    y: feature.position.y + out.y * (radius + gap),
  };
};

export const LIGHT_TURRET = TURRET_FEATURES.find(({ team }) => team === 'light');
/**
 * A light turret whose lines out are open for its whole range. The line out of `LIGHT_TURRET`, away
 * from its Stronghold, meets a cliff 7.35 m from its centre, inside its 8 m pylon, where its bolts
 * end; its line turned 60 degrees from that is open.
 */
export const FIRING_TURRET = TURRET_FEATURES.find(({ id }) => id === 'light-turret-2');

/** Ticks from the match start to the end of its countdown, when turrets start to fire. */
export const COUNTDOWN = countdownTicks(config.match.countdownSeconds, config.tickRate);

/**
 * Spawns one dark `kind` at `at` and runs the tick that spawns it; returns its id. The dev command
 * runs first in its tick, before the match spawns its own units.
 */
export const spawnDark = (
  { simulation, state, run }: ReturnType<typeof setUp>,
  kind: string,
  definitionId: string,
  at: Vec2,
): string => {
  let id = '';
  const stop = state.events.on('entity-spawned', (spawned) => {
    const isOurs =
      id === '' &&
      spawned.team === 'dark' &&
      state.entities.get(spawned.entityId)?.definitionId === definitionId;
    if (isOurs) id = spawned.entityId;
  });
  simulation.enqueueCommand({ type: 'dev-spawn', kind, definitionId, team: 'dark', at, count: 1 });
  run(1);
  stop();
  return id;
};
