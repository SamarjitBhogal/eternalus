import { describe, expect, it } from 'vitest';

import { createDefaultGameConfig } from '../config/defaultGameConfig';
import { loadDefaultContent } from '../content/loadDefaultContent';
import { loadTurrets } from '../content/structures/loadTurrets';
import { STRUCTURE_DEFINITIONS } from '../content/structures/structureCatalogue';
import { NullLogger } from '../diagnostics/NullLogger';
import { createDefaultEntityRegistry } from '../entities/defaultEntityRegistry';
import { EntityFactory } from '../entities/EntityFactory';
import { SpaceIndex } from '../physics/SpaceIndex';
import { IdGenerator } from '../utils/IdGenerator';
import { TWO_LANE_MAP } from '../state/__fixtures__/twoLaneMap';
import { GameState } from '../state/GameState';
import { matchWorldOf } from '../state/__fixtures__/matchWorld';
import { SpaceSystem } from './SpaceSystem';

describe('SpaceSystem', () => {
  it('indexes every unit in store order and finds them by circle', () => {
    const space = new SpaceIndex(TWO_LANE_MAP.width, TWO_LANE_MAP.height, 2);
    const state = new GameState(createDefaultGameConfig(), 1, matchWorldOf(TWO_LANE_MAP), {
      space,
    });
    const factory = new EntityFactory(createDefaultEntityRegistry(), loadDefaultContent(30));
    const ids = [
      { x: 10, y: 10 },
      { x: 11, y: 10 },
      { x: 50, y: 50 },
    ].map((position) => {
      const entity = factory.create('light-mob', 'light-minion', { team: 'light', position });
      state.entities.add(entity);
      return entity.id;
    });
    const system = new SpaceSystem(space);

    system.update({ state, logger: new NullLogger() });

    const out = new Int32Array(space.count);
    const found = space.queryCircle(10, 10, 2, out);
    expect(space.count).toBe(3);
    expect([...out.subarray(0, found)].map((index) => space.idAt(index))).toEqual(ids.slice(0, 2));
    expect(space.indexOf(ids[2] ?? '')).toBe(2);
    expect(space.indexOf('nobody')).toBeUndefined();
    expect(space.idAt(99)).toBe('');

    state.entities.remove(ids[0] ?? '', 'dev-removed');
    system.update({ state, logger: new NullLogger() });
    expect(space.count).toBe(2);
    expect(space.idAt(0)).toBe(ids[1]);
  });

  it('does not index a structure, so a turret that asks the index for units never sees one', () => {
    const space = new SpaceIndex(TWO_LANE_MAP.width, TWO_LANE_MAP.height, 2);
    const state = new GameState(createDefaultGameConfig(), 1, matchWorldOf(TWO_LANE_MAP), {
      space,
    });
    const units = new EntityFactory(createDefaultEntityRegistry(), loadDefaultContent(30));
    const structures = new EntityFactory(
      createDefaultEntityRegistry(),
      STRUCTURE_DEFINITIONS,
      new IdGenerator(1000),
      null,
      null,
      loadTurrets(30).ammo,
    );
    const tower = structures.create('spawner-tower', 'spawner-tower', {
      team: 'dark',
      position: { x: 10, y: 10 },
    });
    const minion = units.create('light-mob', 'light-minion', {
      team: 'dark',
      position: { x: 11, y: 10 },
    });
    state.entities.add(tower);
    state.entities.add(minion);

    new SpaceSystem(space).update({ state, logger: new NullLogger() });

    expect(space.count).toBe(1);
    expect(space.idAt(0)).toBe(minion.id);
    expect(space.indexOf(tower.id)).toBeUndefined();
  });
});
