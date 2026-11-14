import { describe, expect, it } from 'vitest';
import { createDefaultGameConfig } from '../config/defaultGameConfig';
import { ContentValidationError } from '../content/ContentValidationError';
import { loadDefaultContent } from '../content/loadDefaultContent';
import type { MapDefinition } from '../content/maps/maps.types';
import { GUARD_PLANS } from '../content/structures/guardPlans';
import { NullLogger } from '../diagnostics/NullLogger';
import { createDefaultEntityRegistry } from '../entities/defaultEntityRegistry';
import { EntityFactory } from '../entities/EntityFactory';
import { TWO_LANE_MAP } from '../state/__fixtures__/twoLaneMap';
import { GameState } from '../state/GameState';
import { spawnMapStructures } from '../state/__fixtures__/spawnMapStructures';
import { matchWorldOf } from '../state/__fixtures__/matchWorld';
import { newSystem, NO_OPENING, TICK_RATE } from './__fixtures__/spawnSystemSetup';

describe('SpawnSystem', () => {
  describe('guards (18 §7)', () => {
    it('lays out and spawns the guard plans through its roster on the first tick', () => {
      const config = createDefaultGameConfig({
        match: { countdownSeconds: 6000 },
      });
      const state = new GameState(config, 1, matchWorldOf(TWO_LANE_MAP));
      spawnMapStructures(state);
      const factory = new EntityFactory(
        createDefaultEntityRegistry(),
        loadDefaultContent(TICK_RATE),
      );
      newSystem(state, factory, { guards: GUARD_PLANS, openingWave: NO_OPENING }).update({
        state,
        logger: new NullLogger(),
      });

      const filled: (string | null)[] = [];
      state.guards.forEach(({ guardId }) => filled.push(guardId));
      expect(filled.length).toBeGreaterThan(0);
      expect(filled.every((id) => id !== null)).toBe(true);
    });

    it('rejects a guard plan that names an unknown mob', () => {
      const state = new GameState(createDefaultGameConfig(), 1, matchWorldOf(TWO_LANE_MAP));
      spawnMapStructures(state);
      const factory = new EntityFactory(createDefaultEntityRegistry(), loadDefaultContent(30));
      const guards = {
        stronghold: { ...GUARD_PLANS.stronghold, table: [{ mobId: 'nope', count: 1 }] },
      };

      expect(() => newSystem(state, factory, { guards: guards as typeof GUARD_PLANS })).toThrow(
        /stronghold guard plan names unknown mob "nope"/,
      );
    });

    it('rejects a bad guard plan of a structure that spawns no hordes (a camp) as content', () => {
      const map: MapDefinition = {
        ...TWO_LANE_MAP,
        features: [
          ...TWO_LANE_MAP.features,
          {
            id: 'camp-0',
            kind: 'camp',
            team: 'neutral',
            definitionId: 'forest-camp-light',
            position: { x: 100, y: 50 },
            minimapGlyph: { shape: 'dot', size: 4, colourRole: 'neutral' },
          },
        ],
      };
      const state = new GameState(createDefaultGameConfig(), 1, matchWorldOf(map));
      spawnMapStructures(state);
      const factory = new EntityFactory(createDefaultEntityRegistry(), loadDefaultContent(30));
      const guards = {
        'forest-camp-light': {
          ...GUARD_PLANS['forest-camp-light'],
          table: [{ mobId: 'nope', count: 1 }],
        },
      };

      const build = () => newSystem(state, factory, { guards: guards as typeof GUARD_PLANS });
      expect(build).toThrow(ContentValidationError);
      expect(build).toThrow(/forest-camp-light guard plan names unknown mob "nope"/);
    });
  });
});
