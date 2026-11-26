import { AiSystem } from '../ai/AiSystem';
import { MATCH_PHASES, TERMINAL_MATCH_PHASES } from '../config/matchPhases';
import { AI_CADENCE } from '../content/ai/cadence';
import { DUEL_RULES } from '../content/duel/duelRules';
import { loadScoring } from '../content/match/loadScoring';
import { XP_SOURCES } from '../content/progression/xpSources';
import { DefaultInvariantRunner } from '../diagnostics/DefaultInvariantRunner';
import { createDefaultMatchDirector } from '../match/defaultMatchDirector';
import { CollisionSystem } from '../systems/CollisionSystem';
import { DefaultSystemPipeline } from '../systems/DefaultSystemPipeline';
import type { DefaultPipelineParts } from './buildDefaultPipeline.types';

/**
 * The shipped system pipeline with its match director, invariants, bots and collisions
 * (architecture 03 §6, 12). The director is started here, before any Legend spawns, so the
 * countdown covers tick 0 and `Scoring` hears each Legend's `entity-spawned` and gives it a row.
 */
export const buildDefaultPipeline = ({
  state,
  timeline,
  debug,
  logger,
  content: { factory, units, curves, controllers },
  space,
  structures,
  onBotCommand,
  map,
  mapObjects,
  guardPlans,
  arena,
  duelStarts,
}: DefaultPipelineParts): DefaultSystemPipeline => {
  const scoring = loadScoring(state.config.tickRate);
  const director = createDefaultMatchDirector({ state, timeline, debug, logger, scoring });
  const pipeline = new DefaultSystemPipeline({
    invariants: new DefaultInvariantRunner({
      debug,
      logger,
      curves,
      phaseOrder: MATCH_PHASES,
      terminalPhases: TERMINAL_MATCH_PHASES,
    }),
    state,
    progression: {
      units,
      curves,
      xpSources: XP_SOURCES,
      ...(arena === undefined ? {} : { legendsStartAtMaxLevel: DUEL_RULES.legendsStartAtMaxLevel }),
    },
    director,
    // One scoring load: a gem kill's window is the assists' window (DEC-346).
    assistWindowTicks: scoring.assistWindowTicks,
    ...(duelStarts === undefined ? {} : { duelStarts }),
    ...(arena === undefined ? {} : { spawnsMobs: arena.spawnsMobs }),
    hordes: {
      factory,
      space,
      ...(guardPlans === undefined ? {} : { guards: guardPlans }),
      collisions:
        map === undefined || mapObjects === undefined ? [] : [new CollisionSystem(map, mapObjects)],
      decide: [new AiSystem(state, controllers, AI_CADENCE, onBotCommand)],
    },
    structures,
  });
  director.start(state);
  return pipeline;
};
