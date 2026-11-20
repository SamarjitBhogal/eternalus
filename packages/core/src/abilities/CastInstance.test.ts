import { describe, expect, it } from 'vitest';

import { DamagePipeline } from '../combat/DamagePipeline';
import { StatusEffectApplier } from '../combat/StatusEffectApplier';
import { ContentCatalogue } from '../content/ContentCatalogue';
import type { AbilityDisplayStep } from '../content/loadDisplayContent';
import { loadStatusEffects } from '../content/status-effects/loadStatusEffects';
import type { AbilityEffect, CastContext, EffectStep } from './AbilityEffect.types';
import { casterState } from './__fixtures__/casterState';
import { fakeAbility, testAbilityRegistry } from './__fixtures__/fakeAbilities';
import { RecordingEffect } from './__fixtures__/RecordingEffect';
import { CastInstance } from './CastInstance';
import { TargetQuery } from './TargetQuery';

const DISC = { kind: 'circle', radius: 3 } as const;
const END = { from: { x: 6, y: 0 }, to: { x: 6, y: 0 } };
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
    ).run();

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
    ).run();

    expect(strike.log[0]?.cast.direction).toEqual({ x: 0, y: 0 });
  });

  it('fires only the steps due by now, in list order, and returns the first one still waiting', () => {
    const { cast, at, fired } = timeline();

    const atCast = cast.run();
    at(1);
    const tickOne = cast.run(undefined, atCast);
    at(2);
    const tickTwo = cast.run(undefined, tickOne);
    at(4);
    const tickFour = cast.run(undefined, tickTwo);
    at(5);
    const tickFive = cast.run(undefined, tickFour);

    expect([atCast, tickOne, tickTwo, tickFour, tickFive]).toEqual([1, 1, 3, 3, 4]);
    expect(fired()).toEqual(['fake-strike', 'fake-blast', 'fake-strike', 'fake-blast']);
  });

  it('places a later step where it is told, its direction still the one fixed at the cast', () => {
    const { cast, log, at } = timeline();
    const later = { from: { x: 3, y: 3 }, to: { x: 3, y: 3 } };

    cast.run();
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
});
