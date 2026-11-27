import { describe, expect, it } from 'vitest';

import { Progression } from '../components/Progression';
import { createDefaultGameConfig } from '../config/defaultGameConfig';
import { MATCH_PHASES, TERMINAL_MATCH_PHASES } from '../config/matchPhases';
import { WARRIOR } from '../content/legends/warrior';
import { ContentCatalogue } from '../content/ContentCatalogue';
import { loadDefaultContent } from '../content/loadDefaultContent';
import { MAP_OBJECT_DEFINITIONS } from '../content/maps/mapObjectDefinitions';
import { loadScoring } from '../content/match/loadScoring';
import { LEGEND_LEVEL_CURVE } from '../content/progression/levelCurves';
import { loadLevelCurves } from '../content/progression/loadLevelCurves';
import { XP_SOURCES } from '../content/progression/xpSources';
import { loadWeapons } from '../content/weapons/loadWeapons';
import { DefaultInvariantRunner } from '../diagnostics/DefaultInvariantRunner';
import { TEST_DEBUG_CONFIG } from '../diagnostics/InvariantRunner.constants';
import { MemoryLogger } from '../diagnostics/MemoryLogger';
import { createDefaultEntityRegistry } from '../entities/defaultEntityRegistry';
import { EntityFactory } from '../entities/EntityFactory';
import type { DefinitionSource } from '../entities/EntityFactory.types';
import type { GameEventMap } from '../state/GameEvents.types';
import { GameState } from '../state/GameState';
import { WorldObjectStore } from '../state/WorldObjectStore';
import { IdGenerator } from '../utils/IdGenerator';
import { DefaultSystemPipeline } from './DefaultSystemPipeline';

const config = createDefaultGameConfig();
const DEFAULT_UNITS = loadDefaultContent(config.tickRate);
/** The default units, with the Warrior's basic attack growing 50% per level, 25% on structures. */
const STEEP_UNITS: DefinitionSource = {
  has: (id) => DEFAULT_UNITS.has(id),
  get: (id) =>
    id === WARRIOR.id
      ? {
          ...WARRIOR,
          levelScaling: {
            ...WARRIOR.levelScaling,
            basicAttackPerLevel: 0.5,
            basicAttackPerLevelOnStructures: 0.25,
          },
        }
      : DEFAULT_UNITS.get(id),
};

/** An enemy wall map object (07 §13), spawned as a match spawns it; returns its entity id. */
const spawnWall = (state: GameState): string =>
  new WorldObjectStore({
    objects: [
      {
        id: 'wall',
        kind: 'wall',
        team: 'dark',
        isBlocking: true,
        footprints: [
          [
            { x: 0.5, y: -0.5 },
            { x: 1.5, y: -0.5 },
            { x: 1.5, y: 0.5 },
            { x: 0.5, y: 0.5 },
          ],
        ],
      },
    ],
    factory: new EntityFactory(
      createDefaultEntityRegistry(),
      new ContentCatalogue(Object.values(MAP_OBJECT_DEFINITIONS)),
      new IdGenerator(2000),
    ),
    entities: state.entities,
    definitions: MAP_OBJECT_DEFINITIONS,
  }).snapshot()[0]?.entityId ?? '';

/**
 * The first hit a Warrior at `level` lands on a dummy (or a wall), in a match built with `units`.
 */
const firstHit = (
  units: DefinitionSource,
  level: number,
  target: 'dummy' | 'wall' = 'dummy',
): number => {
  const logger = new MemoryLogger();
  const state = new GameState(config, 1);
  const curves = loadLevelCurves();
  const pipeline = new DefaultSystemPipeline({
    assistWindowTicks: loadScoring(config.tickRate).assistWindowTicks,
    invariants: new DefaultInvariantRunner({
      debug: TEST_DEBUG_CONFIG,
      logger,
      curves,
      phaseOrder: MATCH_PHASES,
      terminalPhases: TERMINAL_MATCH_PHASES,
    }),
    state,
    progression: { units, curves, xpSources: XP_SOURCES },
    director: { update: () => undefined },
  });
  const factory = new EntityFactory(
    createDefaultEntityRegistry(),
    units,
    undefined,
    loadWeapons(config.tickRate),
  );
  const warrior = factory.create('warrior', 'warrior', { position: { x: 0, y: 0 }, team: 'light' });
  const dummy = factory.create('light-mob', 'training-dummy', {
    position: { x: 1, y: 0 },
    team: 'dark',
  });
  state.entities.add(warrior);
  state.entities.add(dummy);
  const targetId = target === 'wall' ? spawnWall(state) : dummy.id;
  const progression = warrior.getComponent(Progression);
  progression.addXp(progression.xpToReach(level, LEGEND_LEVEL_CURVE), LEGEND_LEVEL_CURVE);
  const hits: GameEventMap['damage-applied'][] = [];
  state.events.on('damage-applied', (event) => hits.push(event));
  state.entities.setAttackTarget(warrior.id, targetId);

  pipeline.run({ state, logger });

  expect(hits).toHaveLength(1);
  return hits[0]?.amount ?? 0;
};

describe('DefaultSystemPipeline basic-attack level scaling (DEC-380 (2))', () => {
  it("scales a Legend's weapon hit by the match's own unit definitions", () => {
    // 1 + 0.5 × (3 − 1) = 2 with the injected 0.5; the catalogue's own value would give less.
    expect(firstHit(STEEP_UNITS, 1)).toBeGreaterThan(0);
    expect(firstHit(STEEP_UNITS, 3)).toBeCloseTo(2 * firstHit(STEEP_UNITS, 1));
  });

  it('scales a weapon hit on a wall map object at the structure rate (DEC-405)', () => {
    // 1 + 0.25 × (3 − 1) = 1.5 with the injected structure rate, not the unit rate's 2.
    expect(firstHit(STEEP_UNITS, 1, 'wall')).toBeGreaterThan(0);
    expect(firstHit(STEEP_UNITS, 3, 'wall')).toBeCloseTo(1.5 * firstHit(STEEP_UNITS, 1, 'wall'));
  });
});
