import { describe, expect, it } from 'vitest';

import { createDefaultGameConfig } from '../config/defaultGameConfig';
import type { GameConfig } from '../config/GameConfig.types';
import { STRUCTURE_DEFINITIONS } from '../content/structures/structureCatalogue';
import { MemoryLogger } from '../diagnostics/MemoryLogger';
import { Legend } from '../entities/Legend';
import { MapGenerator } from '../map/MapGenerator';
import type { RosterSlot } from '../Simulation.types';
import { GameState } from '../state/GameState';
import { buildMatchWorld } from './buildMatchWorld';
import { loadMatchContent } from './matchContent';
import { RosterSpawner } from './RosterSpawner';

const SEED = 5;

const bot = (team: 'light' | 'dark', definitionId = 'warrior'): RosterSlot => ({
  pilot: 'bot',
  team,
  definitionId,
  role: 'laner',
  difficulty: 'normal',
});

const human = (team: 'light' | 'dark', definitionId = 'magus'): RosterSlot => ({
  pilot: 'human',
  team,
  definitionId,
  role: 'rover',
});

/** A spawner over a fresh state, on a generated map unless `hasMap` is false. */
const setUp = ({
  config = createDefaultGameConfig(),
  hasMap = true,
}: { readonly config?: GameConfig; readonly hasMap?: boolean } = {}) => {
  const map = hasMap ? new MapGenerator().generate(config, SEED) : undefined;
  const { space, world, paths } = buildMatchWorld(map, config);
  const state = new GameState(config, SEED, world, { space, paths });
  const { controllers, factory } = loadMatchContent(config.tickRate, {
    structures: STRUCTURE_DEFINITIONS,
  });
  const logger = new MemoryLogger();
  return { state, logger, spawner: new RosterSpawner(state, factory, controllers, logger) };
};

const legendCount = (state: GameState, team: 'light' | 'dark') =>
  state.entities.countOnTeam(team, Legend);

describe('RosterSpawner', () => {
  it('does nothing for an empty roster, even without a map', () => {
    const { state, spawner } = setUp({ hasMap: false });

    spawner.spawn([]);

    expect(state.entities.size).toBe(0);
  });

  it('refuses a roster without a map', () => {
    const { spawner } = setUp({ hasMap: false });

    expect(() => {
      spawner.spawn([bot('light')]);
    }).toThrow('A roster needs a map');
  });

  it('spawns bots and seats the human on its team', () => {
    const { state, spawner } = setUp();

    spawner.spawn([bot('light'), bot('dark'), human('light')]);

    expect(legendCount(state, 'light')).toBe(2);
    expect(legendCount(state, 'dark')).toBe(1);
    const humanId = state.match.humanLegendIdOf('light');
    expect(humanId).not.toBeNull();
    expect(state.entities.teamOf(humanId ?? '')).toBe('light');
    expect(state.match.humanLegendIdOf('dark')).toBeNull();
  });

  it('refuses two human slots on one team before anything spawns', () => {
    const { state, spawner } = setUp();

    expect(() => {
      spawner.spawn([bot('light'), human('light'), human('light')]);
    }).toThrow('a team has at most one human');
    expect(state.entities.size).toBe(0);
  });

  it('refuses a lone human slot off the player team', () => {
    const { spawner } = setUp();

    expect(() => {
      spawner.spawn([human('dark')]);
    }).toThrow('match.playerTeam is light');
  });

  it('refuses a team larger than legendsPerTeam before anything spawns', () => {
    const { state, spawner } = setUp({
      config: createDefaultGameConfig({ match: { legendsPerTeam: 1 } }),
    });

    expect(() => {
      spawner.spawn([bot('light'), bot('light')]);
    }).toThrow('match.legendsPerTeam allows 1');
    expect(state.entities.size).toBe(0);
  });

  it('refuses a bot whose definition is not a Legend', () => {
    const { spawner } = setUp();

    expect(() => {
      spawner.spawn([bot('light', 'no-such-legend')]);
    }).toThrow('cannot spawn "no-such-legend"');
  });

  it('logs a human slot it cannot spawn and spawns the rest', () => {
    const { state, logger, spawner } = setUp();

    spawner.spawn([bot('light'), human('light', 'no-such-legend')]);

    expect(legendCount(state, 'light')).toBe(1);
    expect(state.match.humanLegendIdOf('light')).toBeNull();
    expect(logger.records).toContainEqual(
      expect.objectContaining({ severityText: 'ERROR', scope: 'core.match' }),
    );
  });
});
