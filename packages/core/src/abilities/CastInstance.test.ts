import { describe, expect, it } from 'vitest';

import { DamagePipeline } from '../combat/DamagePipeline';
import { StatusEffectApplier } from '../combat/StatusEffectApplier';
import { StatusEffects } from '../components/StatusEffects';
import { ContentCatalogue } from '../content/ContentCatalogue';
import type { AbilityDisplayStep } from '../content/loadDisplayContent';
import { ERUDITION } from '../content/status-effects/erudition';
import { loadStatusEffects } from '../content/status-effects/loadStatusEffects';
import type { AbilityEffect, CastContext, EffectStep } from './AbilityEffect.types';
import { casterState } from './__fixtures__/casterState';
import { fakeAbility, testAbilityRegistry } from './__fixtures__/fakeAbilities';
import { RecordingEffect } from './__fixtures__/RecordingEffect';
import { CastInstance } from './CastInstance';
import { TargetQuery } from './TargetQuery';

const DISC = { kind: 'circle', radius: 3 } as const;
const END = { from: { x: 6, y: 0 }, to: { x: 6, y: 0 } };
/** Placed on the caster at the cast (its `origin`), as `AbilitySystem` places a new cast. */
const AT_ORIGIN = { from: { x: 0, y: 0 }, to: { x: 0, y: 0 } };
const STATUSES = loadStatusEffects(30, 2);

/**
 * A cast at tick 0 of `fake-timeline`: a strike at the cast, a blast and a strike 2 ticks later and
 * a blast 5 ticks later, all recorded in one log; aimed east from the origin.
 */
const timeline = () => {
  const { state, caster } = casterState();
  const strike = new RecordingEffect('fake-strike');
  const blast = new RecordingEffect('fake-blast', strike.log);
  const registry = testAbilityRegistry(
    [strike, blast],
    new ContentCatalogue([
      fakeAbility({
        id: 'fake-timeline',
        effects: [
          { kind: 'fake-strike' },
          { kind: 'fake-blast', delayTicks: 2 },
          { kind: 'fake-strike', delayTicks: 2 },
          { kind: 'fake-blast', delayTicks: 5 },
        ],
      }),
    ]),
  );
  const cast = new CastInstance(
    {
      casterId: caster.id,
      ability: registry.resolve('fake-timeline'),
      slot: 'ability-1',
      aim: { point: { x: 4, y: 0 }, targetId: null },
      origin: { x: 0, y: 0 },
      casterLevel: 1,
      tick: 0,
    },
    {
      state,
      effects: registry,
      targets: new TargetQuery(registry),
      damage: new DamagePipeline(),
      statuses: new StatusEffectApplier(STATUSES),
    },
  );
  /** Steps the state to `tick`. */
  const at = (tick: number): void => {
    while (state.tick < tick) state.advanceTick();
  };
  /** The kinds fired so far, in order. */
  const fired = (): string[] => strike.log.map(({ spec }) => spec.kind);
  return { cast, log: strike.log, at, fired };
};

/** A dash stand-in: runs its nested step at the dash's end, through the context. */
class NestingEffect implements AbilityEffect {
  public readonly kind = 'fake-nest';

  public validate(): readonly string[] {
    return [];
  }

  public describe(): readonly AbilityDisplayStep[] {
    return [];
  }

  public apply(_spec: EffectStep, cast: CastContext): void {
    cast.run({ kind: 'fake-strike' }, END);
  }
}

describe('CastInstance', () => {
  it('fires each step on the caster, and a nested step where its parent places it', () => {
    const { state, factory, caster } = casterState();
    const near = factory.create('light-mob', 'training-dummy', {
      position: { x: 6, y: 1 },
      team: 'dark',
    });
    state.entities.add(near);
    const strike = new RecordingEffect('fake-strike');
    const registry = testAbilityRegistry(
      [strike, new NestingEffect()],
      new ContentCatalogue([fakeAbility({ id: 'fake-nest', effects: [{ kind: 'fake-nest' }] })]),
    );
    for (let tick = 0; tick < 7; tick += 1) state.advanceTick(); // the cast tick

    new CastInstance(
      {
        casterId: caster.id,
        ability: registry.resolve('fake-nest'),
        slot: 'ability-1',
        aim: { point: { x: 6, y: 0 }, targetId: null },
        origin: { x: 0, y: 0 },
        casterLevel: 3,
        tick: 7,
      },
      {
        state,
        effects: registry,
        targets: new TargetQuery(registry),
        damage: new DamagePipeline(),
        statuses: new StatusEffectApplier(loadStatusEffects(30, 2)),
      },
    ).run(AT_ORIGIN);

    const [nested] = strike.log;
    expect(nested?.cast).toMatchObject({
      casterId: caster.id,
      abilityId: 'fake-nest',
      tick: 7,
      direction: { x: 1, y: 0 },
      placement: END,
    });
    expect(nested?.cast.targets(DISC, { team: 'enemies' })).toEqual([near.id]);
  });

  it('gives a zero direction when the aim is on the caster', () => {
    const { state, caster } = casterState();
    const strike = new RecordingEffect('fake-strike');
    const registry = testAbilityRegistry([strike]);

    new CastInstance(
      {
        casterId: caster.id,
        ability: registry.resolve('fake-strike'),
        slot: 'ability-1',
        aim: { point: { x: 0, y: 0 }, targetId: null },
        origin: { x: 0, y: 0 },
        casterLevel: 1,
        tick: 0,
      },
      {
        state,
        effects: registry,
        targets: new TargetQuery(registry),
        damage: new DamagePipeline(),
        statuses: new StatusEffectApplier(loadStatusEffects(30, 2)),
      },
    ).run(AT_ORIGIN);

    expect(strike.log[0]?.cast.direction).toEqual({ x: 0, y: 0 });
  });

  it('calls a step due from delayTicks after the cast tick on, not a tick before', () => {
    const step = { delayTicks: 3 };

    expect([9, 10, 11].map((now) => CastInstance.isDue(7, step, now))).toEqual([false, true, true]);
    expect(CastInstance.isDue(7, { delayTicks: 0 }, 7)).toBe(true);
  });

  it('fires only the steps due by now, in list order, and returns the first one still waiting', () => {
    const { cast, at, fired } = timeline();

    const atCast = cast.run(AT_ORIGIN);
    at(1);
    const tickOne = cast.run(AT_ORIGIN, atCast);
    at(2);
    const tickTwo = cast.run(AT_ORIGIN, tickOne);
    at(4);
    const tickFour = cast.run(AT_ORIGIN, tickTwo);
    at(5);
    const tickFive = cast.run(AT_ORIGIN, tickFour);

    expect([atCast, tickOne, tickTwo, tickFour, tickFive]).toEqual([1, 1, 3, 3, 4]);
    expect(fired()).toEqual(['fake-strike', 'fake-blast', 'fake-strike', 'fake-blast']);
  });

  it('places a later step where it is told, its direction still the one fixed at the cast', () => {
    const { cast, log, at } = timeline();
    const later = { from: { x: 3, y: 3 }, to: { x: 3, y: 3 } };

    cast.run(AT_ORIGIN);
    at(2);
    cast.run(later, 1);

    expect(log.map(({ cast: context }) => context.placement)).toEqual([
      { from: { x: 0, y: 0 }, to: { x: 0, y: 0 } },
      later,
      later,
    ]);
    expect(log.map(({ cast: context }) => context.direction)).toEqual([
      { x: 1, y: 0 },
      { x: 1, y: 0 },
      { x: 1, y: 0 },
    ]);
  });

  describe('the ability stats of the caster’s statuses (Erudition, DEC-330)', () => {
    /** The context a step sees, cast by a Warrior that holds `statusId` (none when null). */
    const contextWith = (
      statusId: string | null,
      catalogue = STATUSES,
    ): CastContext | undefined => {
      const { state, caster } = casterState();
      if (statusId !== null) {
        caster.getComponent(StatusEffects).apply(catalogue.get(statusId), null, 0);
      }
      const strike = new RecordingEffect('fake-strike');
      const registry = testAbilityRegistry([strike]);
      new CastInstance(
        {
          casterId: caster.id,
          ability: registry.resolve('fake-strike'),
          slot: 'ability-1',
          aim: { point: { x: 4, y: 0 }, targetId: null },
          origin: { x: 0, y: 0 },
          casterLevel: 1,
          tick: 0,
        },
        {
          state,
          effects: registry,
          targets: new TargetQuery(registry),
          damage: new DamagePipeline(),
          statuses: new StatusEffectApplier(catalogue),
        },
      ).run(AT_ORIGIN);
      return strike.log[0]?.cast;
    };

    it('gives potency 1.1 with Erudition and 1 without', () => {
      expect(contextWith('erudition')?.potency).toBeCloseTo(1.1);
      expect(contextWith(null)?.potency).toBe(1);
    });

    it('stretches a step override by 1.2, rounded, and the status’s own duration when none is given', () => {
      const cast = contextWith('erudition');

      expect(cast?.statusDuration({ statusId: 'stun', durationTicks: 90 })).toBe(108);
      expect(cast?.statusDuration({ statusId: 'stun', durationTicks: 15 })).toBe(18);
      expect(cast?.statusDuration({ statusId: 'concussion' })).toBe(108);
      expect(cast?.statusDuration({ statusId: 'stun', durationTicks: 8 })).toBe(10); // 9.6 rounds up
    });

    it('leaves a duration alone without Erudition, and a permanent status without one', () => {
      expect(contextWith(null)?.statusDuration({ statusId: 'stun', durationTicks: 90 })).toBe(90);
      expect(contextWith(null)?.statusDuration({ statusId: 'concussion' })).toBe(90);
      expect(contextWith('erudition')?.statusDuration({ statusId: 'enraged' })).toBeUndefined();
    });

    it('never lets a stretched status last under one tick', () => {
      const shrinking = loadStatusEffects(30, 2, [
        {
          ...ERUDITION,
          id: 'brief',
          modifiers: [{ stat: 'abilityDuration', op: 'mul', value: 0.3 }],
        },
      ]);

      expect(
        contextWith('brief', shrinking)?.statusDuration({ statusId: 'brief', durationTicks: 1 }),
      ).toBe(1);
    });
  });
});
