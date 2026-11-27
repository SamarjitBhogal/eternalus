import { describe, expect, it, vi } from 'vitest';

import type { LaneProgressOf } from '../combat/MinionStrengthStep.types';
import { createDefaultGameConfig } from '../config/defaultGameConfig';
import { MATCH_PHASES, TERMINAL_MATCH_PHASES } from '../config/matchPhases';
import { loadDefaultContent } from '../content/loadDefaultContent';
import { RUINED_FORT_WALL_DEFINITION } from '../content/maps/mapObjectDefinitions';
import { loadScoring } from '../content/match/loadScoring';
import { loadLevelCurves } from '../content/progression/loadLevelCurves';
import { XP_SOURCES } from '../content/progression/xpSources';
import { TEST_DEBUG_CONFIG } from '../diagnostics/InvariantRunner.constants';
import { DefaultInvariantRunner } from '../diagnostics/DefaultInvariantRunner';
import { MemoryLogger } from '../diagnostics/MemoryLogger';
import { createDefaultEntityRegistry } from '../entities/defaultEntityRegistry';
import { EntityFactory } from '../entities/EntityFactory';
import { LaneFlowFields } from '../map/LaneFlowFields';
import { SpaceIndex } from '../physics/SpaceIndex';
import { TWO_LANE_MAP } from '../state/__fixtures__/twoLaneMap';
import { matchWorldOf } from '../state/__fixtures__/matchWorld';
import { GameState } from '../state/GameState';
import { DefaultSystemPipeline } from './DefaultSystemPipeline';

const HOME = { x: 10, y: 20 };
const FAR = { x: 150, y: 20 };

/** A lane field that can say only near home, and a polyline that always says 0.9. */
const field: { readonly progress: LaneProgressOf } = {
  progress: (_laneId, _team, { x }) => (x < 50 ? x / 100 : null),
};
const polyline: { readonly progress: LaneProgressOf } = { progress: () => 0.9 };

describe('DefaultSystemPipeline.laneProgressOf, the minion strength wiring (05 §9, DEC-384)', () => {
  it('reads the lane field, and the polyline where the field cannot say', () => {
    const progressOf = DefaultSystemPipeline.laneProgressOf(field, polyline);

    expect(progressOf('lane-0', 'light', HOME)).toBe(0.1);
    expect(progressOf('lane-0', 'light', FAR)).toBe(0.9);
  });

  it('reads the polyline alone without lane fields, and says nothing without a map', () => {
    expect(DefaultSystemPipeline.laneProgressOf(null, polyline)('lane-0', 'light', HOME)).toBe(0.9);
    expect(DefaultSystemPipeline.laneProgressOf(null, null)('lane-0', 'light', HOME)).toBeNull();
  });

  it('builds the match pipeline with the match’s lane fields first, then its lane polylines', () => {
    const laneProgressOf = vi.spyOn(DefaultSystemPipeline, 'laneProgressOf');
    const config = createDefaultGameConfig();
    const world = matchWorldOf(TWO_LANE_MAP);
    const state = new GameState(config, 1, world, {
      space: new SpaceIndex(TWO_LANE_MAP.width, TWO_LANE_MAP.height, 2),
    });
    const units = loadDefaultContent(config.tickRate);
    const curves = loadLevelCurves();

    new DefaultSystemPipeline({
      invariants: new DefaultInvariantRunner({
        debug: TEST_DEBUG_CONFIG,
        logger: new MemoryLogger(),
        curves,
        phaseOrder: MATCH_PHASES,
        terminalPhases: TERMINAL_MATCH_PHASES,
      }),
      state,
      progression: { units, curves, xpSources: XP_SOURCES },
      // Strength wiring is the subject here, not the match: no director moves the phase.
      director: { update: () => undefined },
      ruinWall: RUINED_FORT_WALL_DEFINITION,
      hordes: {
        factory: new EntityFactory(createDefaultEntityRegistry(), units),
        space: null,
        decide: [],
      },
      assistWindowTicks: loadScoring(config.tickRate).assistWindowTicks,
    });

    expect(laneProgressOf).toHaveBeenCalledTimes(1);
    const [fields, routes] = laneProgressOf.mock.calls[0] ?? [];
    expect(routes).toBe(world.routes);
    expect(fields).toBeInstanceOf(LaneFlowFields);
    const expected = new LaneFlowFields(
      world.grid,
      world.definition,
      config.map.flowFieldCorridorHalfWidth,
    );
    for (const lane of TWO_LANE_MAP.lanes) {
      for (const team of ['light', 'dark'] as const) {
        for (const point of lane.path) {
          expect(fields?.progress(lane.id, team, point)).toBe(
            expected.progress(lane.id, team, point),
          );
        }
      }
    }
  });
});
