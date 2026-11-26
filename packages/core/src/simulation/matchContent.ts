import { AiSystem } from '../ai/AiSystem';
import {
  createDefaultControllerRegistry,
  type ControllerRegistry,
} from '../ai/defaultControllerRegistry';
import { loadAggroRules } from '../content/ai/aggro/loadAggroRules';
import { RETREAT_STRUCTURES } from '../content/ai/botLaner';
import { BOT_DIFFICULTIES } from '../content/ai/difficulties/botDifficulties';
import { LANE_ASSESSMENT_WEIGHTS } from '../content/ai/laneAssessmentWeights';
import { ROVER_TACTICS } from '../content/ai/rover';
import { unitClassOf } from '../content/ai/unitClasses';
import type { ContentCatalogue } from '../content/ContentCatalogue';
import { LEGEND_KIND_IDS } from '../content/legends/legendKinds';
import { loadDefaultContent } from '../content/loadDefaultContent';
import { MAP_OBJECT_DEFINITIONS } from '../content/maps/mapObjectDefinitions';
import type { LevelCurveDefinition } from '../content/progression/progression.types';
import { ZONE_DEFINITIONS } from '../content/zones/zoneCatalogue';
import { loadLevelCurves } from '../content/progression/loadLevelCurves';
import { loadWeapons } from '../content/weapons/loadWeapons';
import { createDefaultEntityRegistry } from '../entities/defaultEntityRegistry';
import { EntityFactory } from '../entities/EntityFactory';
import type { DefinitionSource, WeaponSource } from '../entities/EntityFactory.types';
import type { SimulationOptions, StructureSource } from '../Simulation.types';
import type { MatchContent } from './matchContent.types';

/**
 * Every controller, with the shipped content it reads (architecture 11 §2); the aggro profiles
 * are loaded at `tickRate`.
 */
const createControllers = (tickRate: number): ControllerRegistry => {
  const bots = { difficulties: BOT_DIFFICULTIES, retreatTo: RETREAT_STRUCTURES };
  return createDefaultControllerRegistry({
    leash: { aggro: loadAggroRules(tickRate), classOf: unitClassOf },
    botLegend: bots,
    rover: {
      ...bots,
      tactics: ROVER_TACTICS,
      legendKinds: LEGEND_KIND_IDS,
      laneWeights: LANE_ASSESSMENT_WEIGHTS,
    },
  });
};

/** The shipped unit content, checked against the controllers before the match starts. */
const loadUnitContent = (
  tickRate: number,
  curves: Pick<ContentCatalogue<LevelCurveDefinition>, 'has'>,
  controllers: ControllerRegistry,
  weapons: WeaponSource,
): DefinitionSource => {
  const catalogue = loadDefaultContent(tickRate, curves, weapons);
  AiSystem.assertRegistered(catalogue.all(), controllers);
  return catalogue;
};

/**
 * Every definition one `EntityFactory` builds from (architecture 04 §6): map objects first, then
 * zones, then `units`, then `structures`, so commands and spawning share one id counter.
 */
const matchDefinitions = (
  units: DefinitionSource,
  structures: StructureSource,
): DefinitionSource => {
  const objectsById = new Map(
    Object.values(MAP_OBJECT_DEFINITIONS).map((definition) => [definition.id, definition]),
  );
  const placed: DefinitionSource = {
    has: (id) => objectsById.has(id) || ZONE_DEFINITIONS.has(id) || units.has(id),
    get: (id) =>
      objectsById.get(id) ?? (ZONE_DEFINITIONS.has(id) ? ZONE_DEFINITIONS.get(id) : units.get(id)),
  };
  return {
    has: (id) => placed.has(id) || structures.has(id),
    get: (id) => (placed.has(id) ? placed.get(id) : structures.get(id)),
  };
};

/**
 * The content a match is built from, each part the injected one or the shipped one loaded at
 * `tickRate`: the level curves, the controllers, the unit definitions (checked against the
 * controllers) and the one `EntityFactory` that commands and spawning share, so entity ids come
 * from one counter.
 */
export const loadMatchContent = (
  tickRate: number,
  {
    content,
    levelCurves,
    weapons,
    structures,
  }: Pick<SimulationOptions, 'content' | 'levelCurves' | 'weapons'> & {
    readonly structures: StructureSource;
  },
): MatchContent => {
  const curves = levelCurves ?? loadLevelCurves();
  const weaponSource = weapons ?? loadWeapons(tickRate);
  const controllers = createControllers(tickRate);
  const units = content ?? loadUnitContent(tickRate, curves, controllers, weaponSource);
  const definitions = matchDefinitions(units, structures);
  const factory = new EntityFactory(
    createDefaultEntityRegistry(),
    definitions,
    undefined,
    weaponSource,
  );
  return { curves, controllers, units, factory };
};
