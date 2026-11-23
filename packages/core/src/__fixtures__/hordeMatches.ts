import { createDefaultGameConfig } from '../config/defaultGameConfig';
import { ContentCatalogue } from '../content/ContentCatalogue';
import type { MapDefinition } from '../content/maps/maps.types';
import { loadDefaultContent } from '../content/loadDefaultContent';
import { STRUCTURE_DEFINITIONS } from '../content/structures/structureCatalogue';
import type { StructureDefinition } from '../content/structures/structures.types';
import type { UnitDefinition } from '../content/units/units.types';
import { TEST_DEBUG_CONFIG } from '../diagnostics/InvariantRunner.constants';
import { MemoryLogger } from '../diagnostics/MemoryLogger';
import { Simulation } from '../Simulation';
import { TWO_LANE_MAP } from '../state/__fixtures__/twoLaneMap';

/**
 * The shipped content with every minion's and guard-post mob's (tower guards, camp mobs, the
 * capture point boss) controller and attack taken away, so hordes only march and nothing fights
 * them (a guard chases a minion to its death, MS-34).
 */
export const MARCHING_ONLY = new ContentCatalogue<UnitDefinition>(
  loadDefaultContent(30)
    .all()
    .map((definition) => {
      if (definition.controller !== 'minion' && definition.controller !== 'guard') {
        return definition;
      }
      const { id, kind, displayName, baseHealth, footprintRadius, visionRadius, movementProfile } =
        definition;
      const marcher: UnitDefinition = {
        id,
        kind,
        displayName,
        baseHealth,
        footprintRadius,
        visionRadius,
        movementProfile,
        ...(definition.movementStrategy === undefined
          ? {}
          : { movementStrategy: definition.movementStrategy }),
      };
      return marcher;
    }),
);

/**
 * The shipped structures with every controller and carried ammo taken away, so a lane tower does
 * not shoot the hordes that march on it (DEC-302): marching tests are about where a horde goes,
 * not about the tower's orbs.
 */
export const UNARMED_STRUCTURES = new ContentCatalogue<StructureDefinition>(
  STRUCTURE_DEFINITIONS.all().map((definition) => {
    const unarmed = { ...definition };
    delete unarmed.controller;
    delete unarmed.aiProfile;
    delete unarmed.ammo;
    return unarmed;
  }),
);

/**
 * A match on `map`: one opening horde per lane and team at tick 0, and the first wave 180 s after
 * the countdown (DEC-87, DEC-127), so a test that stops before then sees only the opening hordes;
 * with `isMarchingOnly`, minions never fight and towers never shoot.
 */
export const match = (map: MapDefinition, seed = 1, isMarchingOnly = false) => {
  const logger = new MemoryLogger();
  const config = createDefaultGameConfig();
  const simulation = new Simulation({
    config,
    seed,
    logger,
    debug: TEST_DEBUG_CONFIG,
    map,
    ...(isMarchingOnly ? { content: MARCHING_ONLY, structures: UNARMED_STRUCTURES } : {}),
  });
  return { simulation, logger, config };
};

/** Steps `simulation` for `ticks` ticks. */
export const run = (simulation: Simulation, ticks: number): void => {
  for (let tick = 0; tick < ticks; tick += 1) {
    simulation.step();
  }
};

/** A lane minion, not a tower guard (guards are mobs too, but in no horde). */
export const isMinion = ({ definitionId }: { readonly definitionId: string }): boolean =>
  definitionId.endsWith('-minion');

/** The two-lane map with only its Strongholds, so a march meets no tower before the lane's end. */
export const STRONGHOLDS_ONLY: MapDefinition = {
  ...TWO_LANE_MAP,
  features: TWO_LANE_MAP.features.filter(({ kind }) => kind === 'stronghold'),
};
