import { describe, expect, it } from 'vitest';

import { StatusEffects } from '../components/StatusEffects';
import { createDefaultGameConfig } from '../config/defaultGameConfig';
import { loadDefaultContent } from '../content/loadDefaultContent';
import { FEARED } from '../content/status-effects/feared';
import { loadStatusEffects } from '../content/status-effects/loadStatusEffects';
import { STATUS_EFFECTS } from '../content/status-effects/statusEffectCatalogue';
import { STUN } from '../content/status-effects/stun';
import type { StatusSteeringKind } from '../content/status-effects/statusEffects.types';
import { createDefaultEntityRegistry } from '../entities/defaultEntityRegistry';
import { EntityFactory } from '../entities/EntityFactory';
import { GameState } from '../state/GameState';
import { SeededRandom } from '../utils/SeededRandom';
import { StatusEffectApplier } from './StatusEffectApplier';

const CONFIG = createDefaultGameConfig();

/** A 2 s status that steers in one form only, with a fixed time: nothing left open to draw. */
const FIXED_FEAR = { ...STUN, id: 'fixed-fear', onExpire: [], steering: ['flee-source'] } as const;

const APPLIER = new StatusEffectApplier(
  loadStatusEffects(CONFIG.tickRate, 2, [...STATUS_EFFECTS.all(), FIXED_FEAR]),
);

/** A match on `seed` with one dark training dummy at the origin. */
const setUp = (seed = 1) => {
  const state = new GameState(CONFIG, seed);
  const factory = new EntityFactory(
    createDefaultEntityRegistry(),
    loadDefaultContent(CONFIG.tickRate),
  );
  const dummy = factory.create('light-mob', 'training-dummy', {
    position: { x: 0, y: 0 },
    team: 'dark',
  });
  state.entities.add(dummy);
  const fearOf = () => {
    const fear = dummy
      .getComponent(StatusEffects)
      .active.find(({ definition }) => definition.id === 'feared');
    if (fear === undefined) throw new Error('not feared');
    return fear;
  };
  return { state, dummy, fearOf };
};

/** What the match's RNG will draw next for one Fear: its form, then its time in ticks. */
const nextFearDraws = (state: GameState): { form: StatusSteeringKind; ticks: number } => {
  const replica = SeededRandom.fromState(state.rng.getState());
  const form = FEARED.steering[replica.nextInt(0, 1)] ?? 'flee-source';
  return { form, ticks: replica.nextInt(60, 120) };
};

describe('StatusEffectApplier draws (Fear, DEC-382 (R3 D))', () => {
  it('draws a whole time of 2 to 4 s and either form, covering more than one of each over seeds', () => {
    const times = new Set<number>();
    const forms = new Set<StatusSteeringKind | null>();
    for (let seed = 1; seed <= 20; seed += 1) {
      const { state, dummy, fearOf } = setUp(seed);
      APPLIER.apply(state, dummy.id, 'feared', null);
      const ticks = (fearOf().expiresTick ?? 0) - state.tick;
      expect(Number.isInteger(ticks)).toBe(true);
      expect(ticks).toBeGreaterThanOrEqual(60);
      expect(ticks).toBeLessThanOrEqual(120);
      times.add(ticks);
      forms.add(fearOf().steering);
    }

    expect(times.size).toBeGreaterThan(1);
    expect([...forms].sort()).toEqual(['cower', 'flee-source']);
  });

  it('draws the form, then the time, from the match’s seeded RNG', () => {
    const { state, dummy, fearOf } = setUp(7);
    const { form, ticks } = nextFearDraws(state);

    APPLIER.apply(state, dummy.id, 'feared', null);

    expect(fearOf().steering).toBe(form);
    expect(fearOf().expiresTick).toBe(state.tick + ticks);
  });

  it('gives the same form and time for the same seed', () => {
    const drawn = () => {
      const { state, dummy, fearOf } = setUp(11);
      APPLIER.apply(state, dummy.id, 'feared', null);
      return [fearOf().steering, fearOf().expiresTick];
    };

    expect(drawn()).toEqual(drawn());
  });

  it('draws a new form and time when reapplied; the later expiry wins', () => {
    const { state, dummy, fearOf } = setUp(3);
    APPLIER.apply(state, dummy.id, 'feared', null);
    const first = fearOf().expiresTick ?? 0;
    for (let step = 0; step < 30; step += 1) state.advanceTick();
    const { form, ticks } = nextFearDraws(state);

    APPLIER.apply(state, dummy.id, 'feared', null);

    expect(fearOf().steering).toBe(form);
    expect(fearOf().expiresTick).toBe(Math.max(first, 30 + ticks));
  });

  it('draws only the form when the source gives its own time', () => {
    const { state, dummy, fearOf } = setUp(5);
    const replica = SeededRandom.fromState(state.rng.getState());
    const form = FEARED.steering[replica.nextInt(0, 1)];

    APPLIER.apply(state, dummy.id, 'feared', null, 15);

    expect(fearOf().steering).toBe(form);
    expect(fearOf().expiresTick).toBe(state.tick + 15);
    expect(state.rng.getState()).toEqual(replica.getState());
  });

  it('draws nothing for a status with a fixed time and one form, nor for one that does not steer', () => {
    const { state, dummy } = setUp();
    const before = state.rng.getState();

    expect(APPLIER.apply(state, dummy.id, 'fixed-fear', null)).toBe(true);
    expect(APPLIER.apply(state, dummy.id, 'stun', null)).toBe(true);

    const statuses = dummy.getComponent(StatusEffects);
    expect(statuses.steering?.steering).toBe('flee-source');
    expect(statuses.active.map(({ expiresTick }) => expiresTick)).toEqual([60, 60]);
    expect(state.rng.getState()).toEqual(before);
  });

  it('draws nothing for an application that does not land', () => {
    const { state } = setUp();
    const before = state.rng.getState();

    expect(APPLIER.apply(state, 'entity-404', 'feared', null)).toBe(false);
    expect(state.rng.getState()).toEqual(before);
  });
});
