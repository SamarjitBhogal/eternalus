import { clearCheckpointDefenders } from '../../../__fixtures__/clearCheckpointDefenders';
import { createDefaultGameConfig } from '../../../config/defaultGameConfig';
import type { GameConfig } from '../../../config/GameConfig.types';
import { timelineFrameOf } from '../../../config/timelineFrameOf';
import { timelineMarkTick } from '../../../config/timelineMarkTick';
import { MOB_DEFINITIONS } from '../../../content/mobs/mobCatalogue';
import { TEST_DEBUG_CONFIG } from '../../../diagnostics/InvariantRunner.constants';
import { MemoryLogger } from '../../../diagnostics/MemoryLogger';
import { MapGenerator } from '../../../map/MapGenerator';
import { MapObjectBuilder } from '../../../map/MapObjectBuilder';
import { MapPresentationBuilder } from '../../../map/MapPresentationBuilder';
import { Simulation } from '../../../Simulation';
import type { GameState } from '../../../state/GameState';
import type { EntitySnapshot } from '../../../state/Snapshot.types';
import type { Vec2 } from '../../../utils/geometry.types';

/** The Greater Boss's mob definition. */
export const BOSS = MOB_DEFINITIONS.get('greater-boss');

/** The tick `config`'s timeline entry `id` comes due. */
export const markTick = (config: GameConfig, id: string): number => {
  const entry = config.match.timeline.find((mark) => mark.id === id);
  if (entry === undefined) throw new Error(`No ${id} entry`);
  return timelineMarkTick(entry.at, timelineFrameOf(config));
};

/** A match with no countdown and a `plannedMatchSeconds` plan (20 s: mid-game after 10 s). */
export const match = (plannedMatchSeconds = 20, seed = 1) => {
  const config = createDefaultGameConfig({
    match: { countdownSeconds: 0, plannedMatchSeconds },
  });
  const map = new MapGenerator().generate(config, seed);
  const simulation = new Simulation({
    config,
    seed,
    logger: new MemoryLogger(),
    debug: TEST_DEBUG_CONFIG,
    map,
    mapObjects: new MapObjectBuilder().build(map, new MapPresentationBuilder().build(map)),
  });
  // The Cathedral is a capture zone: a Legend standing in it wakes its checkpoint defenders, whose
  // hits would blur the boss's own (they have their own tests).
  clearCheckpointDefenders(simulation);
  const feature = map.features.find(({ definitionId }) => definitionId === 'cathedral');
  if (feature === undefined) throw new Error('No Cathedral');
  const eruptionTick = markTick(config, 'gem-eruption');
  // The gem erupts on `eruptionTick`; `SpawnSystem` spawns the boss on its next pass (03 §Events).
  return { simulation, config, eruptionTick, spawnTick: eruptionTick + 1, feature };
};

/** Steps `simulation` until it has run `tick` ticks. */
export const stepTo = (simulation: Simulation, tick: number): void => {
  while (simulation.tick < tick) simulation.step();
};

/** Every Greater Boss in the snapshot. */
export const bossesOf = (simulation: Simulation): EntitySnapshot[] =>
  simulation.snapshot().entities.filter(({ definitionId }) => definitionId === BOSS.id);

/** The one Greater Boss; throws unless there is exactly one. */
export const theBoss = (simulation: Simulation): EntitySnapshot => {
  const [boss, ...others] = bossesOf(simulation);
  if (boss === undefined || others.length > 0) throw new Error('Not exactly one Greater Boss');
  return boss;
};

/** Spawns a Light Warrior at `at` (it applies on the next step) and returns its id. */
export const spawnWarrior = (simulation: Simulation, at: Vec2): string => {
  const before = new Set(simulation.snapshot().entities.map(({ id }) => id));
  simulation.enqueueCommand({
    type: 'dev-spawn',
    kind: 'warrior',
    definitionId: 'warrior',
    team: 'light',
    at,
    count: 1,
  });
  simulation.step();
  const warrior = simulation
    .snapshot()
    .entities.find(({ id, kind }) => kind === 'warrior' && !before.has(id));
  if (warrior === undefined) throw new Error('No warrior');
  return warrior.id;
};

/** The simulation's state, for reading brains and dealing a scripted hit. */
export const stateOf = (simulation: Simulation): GameState =>
  (simulation as unknown as { readonly state: GameState }).state;

/** Where entity `id` stands, or `null` once it is gone. */
export const positionOf = (simulation: Simulation, id: string): Vec2 | null => {
  const transform = simulation.snapshot().entities.find((entity) => entity.id === id)?.transform;
  return transform == null ? null : { x: transform.x, y: transform.y };
};
