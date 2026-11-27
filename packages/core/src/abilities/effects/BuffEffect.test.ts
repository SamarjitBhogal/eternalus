import { describe, expect, it } from 'vitest';

import { StatusEffectApplier } from '../../combat/StatusEffectApplier';
import { StatusEffects } from '../../components/StatusEffects';
import { Transform } from '../../components/Transform';
import { createDefaultGameConfig } from '../../config/defaultGameConfig';
import { BERSERK } from '../../content/status-effects/berserk';
import { loadStatusEffects } from '../../content/status-effects/loadStatusEffects';
import { STATUS_EFFECTS } from '../../content/status-effects/statusEffectCatalogue';
import type { AuthoredStatusEffect } from '../../content/status-effects/statusEffects.types';
import type { Entity } from '../../entities/Entity';
import { CollisionResolver } from '../../physics/CollisionResolver';
import { StaticCollisionIndex } from '../../physics/StaticCollisionIndex';
import type { CollisionQuery } from '../../state/CollisionQuery.types';
import { GameState } from '../../state/GameState';
import type { GameEventMap } from '../../state/GameEvents.types';
import type { Polygon } from '../../utils/geometry.types';
import { casterState } from '../__fixtures__/casterState';
import { castSteps } from '../__fixtures__/castSteps';
import { BuffEffect } from './BuffEffect';

const setUp = () => {
  const { state, factory, caster } = casterState();
  const at = (x: number, team: 'light' | 'dark') => {
    state.entities.add(
      factory.create('light-mob', 'training-dummy', { position: { x, y: 0 }, team }),
    );
  };
  const applied: GameEventMap['status-applied'][] = [];
  state.events.on('status-applied', (payload) => applied.push(payload));
  const expiryOf = (entity: Entity, statusId: string) =>
    entity.getComponent(StatusEffects).active.find(({ definition }) => definition.id === statusId)
      ?.expiresTick;
  return { state, caster, at, applied, expiryOf };
};

describe('BuffEffect', () => {
  it('has the kind it is registered under', () => {
    expect(new BuffEffect(STATUS_EFFECTS).kind).toBe('buff');
  });

  it('applies its status to the caster only, credited to the caster', () => {
    const { state, caster, at, applied } = setUp();
    at(1, 'light');
    at(-1, 'dark');

    castSteps(state, caster.id, [{ kind: 'buff', statusId: 'fury' }]);

    expect(applied).toEqual([{ entityId: caster.id, statusId: 'fury', sourceId: caster.id }]);
  });

  it('lasts the step’s own duration when it has one, the status’s otherwise', () => {
    const { state, caster, expiryOf } = setUp();

    castSteps(state, caster.id, [
      { kind: 'buff', statusId: 'rallied', durationTicks: 15 },
      { kind: 'buff', statusId: 'fury' },
    ]);

    expect(expiryOf(caster, 'rallied')).toBe(state.tick + 15);
    expect(expiryOf(caster, 'fury')).toBe(state.tick + 240);
  });

  it('checks its own fields: a known status, a duration override of at least one tick', () => {
    const buff = new BuffEffect(STATUS_EFFECTS);
    const fury = { kind: 'buff', statusId: 'fury' } as const;

    expect(buff.validate(fury)).toEqual([]);
    expect(buff.validate({ ...fury, durationTicks: 15 })).toEqual([]);
    expect(buff.validate({ ...fury, statusId: 'frenzy', durationTicks: 0 })).toEqual([
      'buff status "frenzy" is unknown',
      'buff duration must be positive',
    ]);
  });

  it('draws nothing on the aim overlay: it has no area', () => {
    expect(new BuffEffect(STATUS_EFFECTS).describe()).toEqual([]);
  });
});

/** A wall from x 0 to 10, from `y` to `y + 2`. */
const wallAt = (y: number): Polygon => [
  { x: 0, y },
  { x: 10, y },
  { x: 10, y: y + 2 },
  { x: 0, y: y + 2 },
];

/**
 * A Sentinel (radius 1.25, DEC-06; 1.625 once Berserk grows it) at (5, 5) in a state whose walls
 * are `walls` (none: no collision rule), and the buff step's own check for it.
 */
const roomSetUp = (walls: readonly Polygon[] | null) => {
  const { factory } = casterState();
  const collisions =
    walls === null
      ? null
      : new CollisionResolver(
          new StaticCollisionIndex(
            walls.map((polygon, index) => ({ id: `wall-${String(index)}`, polygon })),
          ),
          { x: 0, y: 0, width: 20, height: 20 },
        );
  const state = new GameState(createDefaultGameConfig(), 1, null, { collisions });
  const sentinel = factory.create('sentinel', 'sentinel', {
    position: { x: 5, y: 5 },
    team: 'light',
  });
  state.entities.add(sentinel);
  const buff = new BuffEffect(STATUS_EFFECTS);
  const check = (statusId: string) =>
    buff.casterBlockedBy({ kind: 'buff', statusId }, sentinel.id, state);
  return { state, sentinel, check };
};

describe('BuffEffect.casterBlockedBy (Berserk needs room, DEC-382, HC-Q113)', () => {
  /** Walls 3 m apart around the Sentinel: its 2.5 m body fits, the grown 3.25 m one does not. */
  const GAP = [wallAt(1.5), wallAt(6.5)];

  it('refuses a status that grows the body where the grown body has no room', () => {
    expect(roomSetUp(GAP).check('berserk')).toBe('no-room');
  });

  it('takes it where the walls push the grown body out to room: beside one wall, or in the open', () => {
    expect(roomSetUp([wallAt(1.5)]).check('berserk')).toBeNull();
    expect(roomSetUp([]).check('berserk')).toBeNull();
    expect(roomSetUp(null).check('berserk')).toBeNull();
  });

  it('measures the grown body from the built radius and the statuses, not from the scale now', () => {
    const { sentinel, check } = roomSetUp(GAP);
    sentinel.getComponent(Transform).resize(0.5); // a scale BodySizeSystem has not set back yet

    expect(check('berserk')).toBe('no-room');
  });

  it('takes a status that does not grow the body, and a recast of one the caster holds already', () => {
    const { state, sentinel, check } = roomSetUp(GAP);
    expect(check('fury')).toBeNull();

    new StatusEffectApplier(loadStatusEffects(30, 2)).apply(state, sentinel.id, 'berserk', null);

    expect(check('berserk')).toBeNull();
  });

  it('grows the body by the one status fold: two `size` adds sum, they do not multiply', () => {
    const growing = (id: string, value: number): AuthoredStatusEffect => ({
      ...BERSERK,
      id,
      modifiers: [{ stat: 'size', op: 'add', value }],
    });
    const loaded = loadStatusEffects(30, 2, [
      growing('swollen', 0.2),
      growing('bloated', 0.3),
      { ...BERSERK, id: 'flat', modifiers: [{ stat: 'size', op: 'mul', value: 1 }] },
    ]);
    const radii: number[] = [];
    const collisions: CollisionQuery = {
      reach: (_from, _direction, distance) => distance,
      hitsWall: () => false,
      pushOut: (at) => at,
      hasRoom: (_at, radius) => {
        radii.push(radius);
        return true;
      },
    };
    const { factory } = casterState();
    const state = new GameState(createDefaultGameConfig(), 1, null, { collisions });
    const sentinel = factory.create('sentinel', 'sentinel', {
      position: { x: 5, y: 5 },
      team: 'light',
    });
    state.entities.add(sentinel);
    sentinel.getComponent(StatusEffects).apply(loaded.get('swollen'), null, 0);

    const buff = new BuffEffect(loaded);
    buff.casterBlockedBy({ kind: 'buff', statusId: 'flat' }, sentinel.id, state);
    expect(radii).toEqual([]); // a `size` × 1 does not grow the body: no room asked

    buff.casterBlockedBy({ kind: 'buff', statusId: 'bloated' }, sentinel.id, state);

    // (1 + 0.2 + 0.3) × the built 1.25 m, as StatusEffects folds it; not (1 + 0.2) × (1 + 0.3).
    expect(radii).toHaveLength(1);
    expect(radii[0]).toBeCloseTo(1.25 * 1.5);
  });
});
