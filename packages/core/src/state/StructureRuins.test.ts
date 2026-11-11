import { describe, expect, it } from 'vitest';
import { Health } from '../components/Health';
import { TeamMembership } from '../components/TeamMembership';
import {
  MAP_OBJECT_DEFINITIONS,
  RUINED_FORT_WALL_DEFINITION,
} from '../content/maps/mapObjectDefinitions';
import { fortFixture } from './__fixtures__/fortTower';
import { StructureRuins } from './StructureRuins';

/** The fort fixture with its ruins rule, and a way to kill the tower from a point. */
const ruinsFixture = () => {
  const fixture = fortFixture();
  const { world, entities, tower, factory } = fixture;
  const ruins = new StructureRuins(world, entities, RUINED_FORT_WALL_DEFINITION);
  /** Puts an attacker at `at`, kills the tower with its hit, and retires the tower. */
  const killFrom = (at: { x: number; y: number } | null): void => {
    const attacker =
      at === null
        ? null
        : factory.create('obstacle', MAP_OBJECT_DEFINITIONS.rock.id, { position: at });
    if (attacker !== null) entities.add(attacker);
    tower.getComponent(Health).applyDamage(tower.getComponent(Health).current);
    ruins.died(tower.id, attacker?.id ?? null);
    entities.remove(tower.id, 'died');
    ruins.removed(tower.id);
  };
  return { ...fixture, ruins, killFrom };
};

describe('StructureRuins', () => {
  it('drops the wall that took the killing hit with the tower and leaves each other wall standing as scenery at half health (DEC-217 (12), DEC-219 (a))', () => {
    const { world, entities, tower, ruins, killFrom } = ruinsFixture();

    killFrom({ x: 5, y: -2 });

    const [keep, top, bottom] = world.snapshot();
    expect(keep).toEqual({ id: 'fort', entityId: null, health: null, isDestroyed: true });
    expect(top).toEqual({ id: 'fort-wall-top', entityId: null, health: null, isDestroyed: true });
    expect(bottom).toMatchObject({
      id: 'fort-wall-bottom',
      health: { current: 1000, max: 1000 },
      isDestroyed: false,
    });
    expect(world.destroyedIds).toEqual(new Set(['fort', 'fort-wall-top']));
    expect(ruins.fallen(tower.id).map(({ id }) => id)).toEqual(['fort', 'fort-wall-top']);
    // The ruins: the keep and the fallen wall stop blocking; the other wall blocks until it falls.
    expect(world.blockingAt({ x: 5, y: 0.5 }, 0.4)).toBeNull();
    expect(world.blockingAt({ x: 5, y: 5 }, 0.5)).toBeNull();
    expect(world.blockingAt({ x: 5, y: 9.5 }, 0.4)).toBe('fort-wall-bottom');
    // That wall is scenery with a pool of its own: either side may break it (DEC-121 (a)).
    const wall = entities.get(bottom?.entityId ?? '');
    expect(wall?.definitionId).toBe(RUINED_FORT_WALL_DEFINITION.id);
    expect(wall?.findComponent(TeamMembership)).toBeUndefined();
    expect(world.objectFor(wall?.id ?? '')?.id).toBe('fort-wall-bottom');
    // It falls on its own, like any map object.
    world.removed(wall?.id ?? '');
    expect(world.destroyedIds.has('fort-wall-bottom')).toBe(true);
    expect(ruins.fallen(wall?.id ?? '').map(({ id }) => id)).toEqual(['fort-wall-bottom']);
  });

  it.each([
    { name: 'on the tower itself', at: { x: 5, y: 3 } },
    { name: 'by no attacker with a position', at: null },
  ])('drops no wall when the killing hit landed $name (DEC-219 (a))', ({ at }) => {
    const { world, tower, ruins, killFrom } = ruinsFixture();

    killFrom(at);

    expect(ruins.fallen(tower.id).map(({ id }) => id)).toEqual(['fort']);
    expect(
      world.snapshot().map(({ id, health, isDestroyed }) => [id, health, isDestroyed]),
    ).toEqual([
      ['fort', null, true],
      ['fort-wall-top', { current: 1000, max: 1000 }, false],
      ['fort-wall-bottom', { current: 1000, max: 1000 }, false],
    ]);
  });

  it('lists the objects that fall while the tower still stands, and none for an unknown entity', () => {
    const { tower, ruins } = ruinsFixture();

    expect(ruins.fallen(tower.id).map(({ id }) => id)).toEqual(['fort']);
    expect(ruins.fallen('unknown')).toEqual([]);
  });

  it('retires a body once: a second removal changes nothing and spawns no second wall', () => {
    const { world, entities, tower, ruins, killFrom } = ruinsFixture();
    killFrom({ x: 5, y: -2 });
    const size = entities.size;

    ruins.removed(tower.id);
    ruins.removed('unknown');

    expect(entities.size).toBe(size);
    expect(world.snapshot()[2]?.health).toEqual({ current: 1000, max: 1000 });
  });
});
