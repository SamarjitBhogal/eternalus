import { describe, expect, it } from 'vitest';

import { Footprint } from '../components/Footprint';
import { MapObjectBody } from '../components/MapObjectBody';
import { Transform } from '../components/Transform';
import { loadDefaultContent } from '../content/loadDefaultContent';
import { MAP_OBJECT_DEFINITIONS } from '../content/maps/mapObjectDefinitions';
import { createDefaultEntityRegistry } from '../entities/defaultEntityRegistry';
import { Entity } from '../entities/Entity';
import { EntityFactory } from '../entities/EntityFactory';
import { EntityStore } from './EntityStore';
import { ReachQuery } from './ReachQuery';

class Dummy extends Entity {
  public readonly kind = 'dummy';
  public readonly family = 'test';

  protected installComponents(): void {
    // A dummy has no components.
  }
}

const reach = new ReachQuery();

describe('ReachQuery', () => {
  it('measures attack reach edge to edge between two collider circles', () => {
    const store = new EntityStore();
    store.add(new Dummy('dummy', 'dummy-definition'));
    const factory = new EntityFactory(createDefaultEntityRegistry(), loadDefaultContent(30));
    const minion = factory.create('light-mob', 'light-minion', {
      team: 'dark',
      position: { x: 0, y: 0 },
    });
    const near = factory.create('light-mob', 'light-minion', {
      team: 'light',
      position: { x: 2, y: 0 },
    });
    const far = factory.create('light-mob', 'light-minion', {
      team: 'light',
      position: { x: 5, y: 0 },
    });
    store.add(minion);
    store.add(near);
    store.add(far);

    // Edge to edge: 2 − 0.4 − 0.4 = 1.2 m, inside the 1.5 m reach; 4.2 m is not.
    expect(reach.isInReach(store, minion.id, near.id)).toBe(true);
    expect(reach.isInReach(store, minion.id, far.id)).toBe(false);
    expect(reach.isInReach(store, 'dummy', near.id)).toBe(false);
    expect(reach.isInReach(store, minion.id, 'nobody')).toBe(false);
  });
  it('measures reach to a map object from its footprint edge, and never to a cornerless one', () => {
    const store = new EntityStore();
    const content = loadDefaultContent(30);
    const { house } = MAP_OBJECT_DEFINITIONS;
    const factory = new EntityFactory(createDefaultEntityRegistry(), {
      has: (id) => id === house.id || content.has(id),
      get: (id) => (id === house.id ? house : content.get(id)),
    });
    const minion = factory.create('light-mob', 'light-minion', {
      team: 'dark',
      position: { x: 0, y: 0 },
    });
    const body = (id: string, footprint: readonly { x: number; y: number }[]) => {
      const entity = factory.create('obstacle', house.id, {
        position: { x: 50, y: 50 },
      });
      entity.addComponent(
        new MapObjectBody({ id, kind: 'house', isBlocking: true, footprints: [footprint] }),
      );
      store.add(entity);
      return entity.id;
    };
    store.add(minion);
    // The closing edge (x = 1.5) is the near one: 1.5 − 0.4 radius = 1.1 m, inside the 1.5 m reach.
    const near = body('near', [
      { x: 1.5, y: 5 },
      { x: 20, y: 5 },
      { x: 20, y: -5 },
      { x: 1.5, y: -5 },
    ]);
    const far = body('far', [
      { x: 4, y: 5 },
      { x: 20, y: 5 },
      { x: 20, y: -5 },
      { x: 4, y: -5 },
    ]);
    const cornerless = body('cornerless', []);

    expect(reach.isInReach(store, minion.id, near)).toBe(true);
    expect(reach.isInReach(store, minion.id, far)).toBe(false);
    expect(reach.isInReach(store, minion.id, cornerless)).toBe(false);
  });

  it("measures reach to a structure with a Footprint from its fort's outline, not its circle (DEC-185)", () => {
    const store = new EntityStore();
    const factory = new EntityFactory(createDefaultEntityRegistry(), loadDefaultContent(30));
    const tower = new Dummy('tower', 'tower-definition');
    // The collider circle: 14 m around (30, 0). The fort's west wall: x 14..17.2.
    tower.addComponent(new Transform({ x: 30, y: 0 }, 14));
    tower.addComponent(
      new Footprint([
        [
          { x: 14, y: -16 },
          { x: 17.2, y: -16 },
          { x: 17.2, y: 16 },
          { x: 14, y: 16 },
        ],
      ]),
    );
    const minionAt = (x: number) => {
      const minion = factory.create('light-mob', 'light-minion', {
        team: 'dark',
        position: { x, y: 0 },
      });
      store.add(minion);
      return minion.id;
    };
    store.add(tower);
    // Pressed on the wall, its 0.4 m radius off it: 16.4 m from the centre, 2 m edge to edge from
    // the circle (past the 1.5 m reach), yet in reach of the wall. 2.5 m off the wall is not.
    const pressed = minionAt(13.6);
    const off = minionAt(11.5);

    expect(reach.isInReach(store, pressed, tower.id)).toBe(true);
    expect(reach.isInReach(store, off, tower.id)).toBe(false);
  });

  it('aims at the outline point nearest the attacker, at the attacker inside it, else at the centre, as reach measures (one aim rule)', () => {
    const store = new EntityStore();
    const square = [
      { x: 10, y: -5 },
      { x: 20, y: -5 },
      { x: 20, y: 5 },
      { x: 10, y: 5 },
    ];
    const house = new Dummy('house', 'house-definition');
    house.addComponent(new Transform({ x: 15, y: 0 }, 0.5));
    house.addComponent(
      new MapObjectBody({ id: 'house', kind: 'house', isBlocking: true, footprints: [square] }),
    );
    const tower = new Dummy('tower', 'tower-definition');
    tower.addComponent(new Transform({ x: 45, y: 0 }, 14));
    tower.addComponent(new Footprint([square.map(({ x, y }) => ({ x: x + 30, y }))]));
    const round = new Dummy('round', 'round-definition');
    round.addComponent(new Transform({ x: -7, y: 3 }, 1));
    store.add(house);
    store.add(tower);
    store.add(round);
    const aim = { x: 0, y: 0 };
    const aimAt = (id: string, from: { x: number; y: number }) =>
      reach.aimPointOf(store, id, from, aim) ? { ...aim } : null;

    expect(store.outlineOf('house')?.polygons).toEqual([square]);
    expect(store.outlineOf('tower')?.polygons).toHaveLength(1);
    expect(store.outlineOf('round')).toBeUndefined();
    expect(aimAt('house', { x: 0, y: 2 })).toEqual({ x: 10, y: 2 });
    expect(aimAt('tower', { x: 60, y: 9 })).toEqual({ x: 50, y: 5 });
    expect(aimAt('round', { x: 0, y: 0 })).toEqual({ x: -7, y: 3 });
    expect(aimAt('nobody', { x: 0, y: 0 })).toBeNull();
    // Inside the outline: the attacker's own position, so reach and chase hold there (DEC-234).
    expect(aimAt('house', { x: 13, y: 1 })).toEqual({ x: 13, y: 1 });
    expect(reach.aimPointOf(store, 'house', { x: 0, y: 2 }, aim)).toBe('outline');
    expect(reach.aimPointOf(store, 'house', { x: 13, y: 1 }, aim)).toBe('inside');
    expect(reach.aimPointOf(store, 'tower', { x: 60, y: 9 }, aim)).toBe('outline');
    expect(reach.aimPointOf(store, 'round', { x: 0, y: 0 }, aim)).toBe('centre');
    expect(reach.aimPointOf(store, 'nobody', { x: 0, y: 0 }, aim)).toBeNull();
  });

  it('faces the aim point from outside an outline and the centre from inside it (DEC-220 (1))', () => {
    const store = new EntityStore();
    const at = (id: string, x: number, y: number): Dummy => {
      const entity = new Dummy(id, `${id}-definition`);
      entity.addComponent(new Transform({ x, y }, 0.5));
      store.add(entity);
      return entity;
    };
    at('house', 15, 0).addComponent(
      new MapObjectBody({
        id: 'house',
        kind: 'house',
        isBlocking: true,
        footprints: [
          [
            { x: 10, y: -5 },
            { x: 20, y: -5 },
            { x: 20, y: 5 },
            { x: 10, y: 5 },
          ],
        ],
      }),
    );
    at('outside', 0, 2);
    at('inside', 11, 4);
    at('round', -7, 3);
    store.add(new Dummy('nowhere', 'nowhere-definition'));
    const out = { x: 0, y: 0 };
    const faceAt = (attackerId: string, targetId: string) =>
      reach.facingPointOf(store, attackerId, targetId, out) ? { ...out } : null;

    expect(faceAt('outside', 'house')).toEqual({ x: 10, y: 2 });
    expect(faceAt('inside', 'house')).toEqual({ x: 15, y: 0 });
    expect(faceAt('outside', 'round')).toEqual({ x: -7, y: 3 });
    expect(faceAt('nowhere', 'house')).toBeNull();
    expect(faceAt('outside', 'nowhere')).toBeNull();
    expect(faceAt('outside', 'nobody')).toBeNull();
  });
});
