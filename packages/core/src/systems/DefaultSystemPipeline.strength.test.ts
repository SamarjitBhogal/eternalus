import { describe, expect, it, vi } from 'vitest';

import * as damageSteps from '../combat/defaultDamageSteps';
import { createDefaultGameConfig } from '../config/defaultGameConfig';
import { loadDefaultContent } from '../content/loadDefaultContent';
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

vi.mock('../combat/defaultDamageSteps', async (importOriginal) => {
  const original = await importOriginal<typeof damageSteps>();
  return { createDefaultDamageSteps: vi.fn(original.createDefaultDamageSteps) };
});

describe('DefaultSystemPipeline minion strength wiring', () => {
  it('hands the damage steps the lane flow fields’ progress, so strength follows the field (05 §9)', () => {
    const config = createDefaultGameConfig();
    const units = loadDefaultContent(config.tickRate);
    const state = new GameState(config, 1, matchWorldOf(TWO_LANE_MAP), {
      space: new SpaceIndex(TWO_LANE_MAP.width, TWO_LANE_MAP.height, 2),
    });
    const curves = loadLevelCurves();
    vi.mocked(damageSteps.createDefaultDamageSteps).mockClear();

    new DefaultSystemPipeline(
      new DefaultInvariantRunner(TEST_DEBUG_CONFIG, new MemoryLogger(), curves),
      state,
      { units, curves, xpSources: XP_SOURCES },
      {
        factory: new EntityFactory(createDefaultEntityRegistry(), units),
        space: null,
        decide: [],
      },
    );

    const [progressOf] = vi.mocked(damageSteps.createDefaultDamageSteps).mock.calls[0] ?? [];
    expect(progressOf).toBeTypeOf('function');
    const world = state.world;
    if (world === null || typeof progressOf !== 'function') throw new Error('not wired');
    const fields = new LaneFlowFields(
      world.grid,
      world.definition,
      config.map.flowFieldCorridorHalfWidth,
    );
    for (const lane of TWO_LANE_MAP.lanes) {
      for (const point of lane.path) {
        expect(progressOf(lane.id, 'light', point)).toBe(fields.progress(lane.id, 'light', point));
      }
    }
  });
});
