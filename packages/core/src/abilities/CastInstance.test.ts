import { describe, expect, it } from 'vitest';

import { DamagePipeline } from '../combat/DamagePipeline';
import { StatusEffectApplier } from '../combat/StatusEffectApplier';
import { Combat } from '../components/Combat';
import { Footprint } from '../components/Footprint';
import { ContentCatalogue } from '../content/ContentCatalogue';
import type { AbilityDisplayStep } from '../content/loadDisplayContent';
import { loadStatusEffects } from '../content/status-effects/loadStatusEffects';
import type { AbilityEffect, CastContext, EffectStep } from './AbilityEffect.types';
import { casterState } from './__fixtures__/casterState';
import { castSteps } from './__fixtures__/castSteps';
import { fakeAbility, testAbilityRegistry } from './__fixtures__/fakeAbilities';
import { RecordingEffect } from './__fixtures__/RecordingEffect';
import { RecordingLauncher } from './__fixtures__/RecordingLauncher';
import { RecordingSummoner } from './__fixtures__/RecordingSummoner';
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
      launcher: new RecordingLauncher(),
      summoner: new RecordingSummoner(),
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
        launcher: new RecordingLauncher(),
        summoner: new RecordingSummoner(),
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

  it("records the enemies a step's shape finds as the caster's hits, and no ally (DEC-322 (2))", () => {
    const { state, factory, caster } = casterState();
    const enemy = factory.create('light-mob', 'training-dummy', {
      position: { x: 1, y: 0 },
      team: 'dark',
    });
    state.entities.add(enemy);
    const strike = new RecordingEffect('fake-strike');
    const registry = testAbilityRegistry([strike]);

    new CastInstance(
      {
        casterId: caster.id,
        ability: registry.resolve('fake-strike'),
        slot: 'ability-1',
        aim: { point: { x: 1, y: 0 }, targetId: null },
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
        launcher: new RecordingLauncher(),
        summoner: new RecordingSummoner(),
      },
    ).run(AT_ORIGIN);
    const [step] = strike.log;
    const combat = caster.getComponent(Combat);

    step?.cast.targets(DISC, { team: 'allies', includeSelf: true });
    expect(combat.hitIds).toEqual([]);
    expect(step?.cast.targets(DISC, { team: 'enemies' })).toEqual([enemy.id]);
    expect(combat.hitsAt(0)).toEqual([enemy.id]);
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
        launcher: new RecordingLauncher(),
        summoner: new RecordingSummoner(),
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
    // The cast's aim and the caster's body (a Warrior, 0.5 m) go with every placement, for a cone.
    const withCast = { direction: { x: 1, y: 0 }, casterRadius: 0.5 };

    cast.run(AT_ORIGIN);
    at(2);
    cast.run(later, 1);

    expect(log.map(({ cast: context }) => context.placement)).toEqual([
      { from: { x: 0, y: 0 }, to: { x: 0, y: 0 }, ...withCast },
      { ...later, ...withCast },
      { ...later, ...withCast },
    ]);
    expect(log.map(({ cast: context }) => context.direction)).toEqual([
      { x: 1, y: 0 },
      { x: 1, y: 0 },
      { x: 1, y: 0 },
    ]);
  });
});

describe('CastInstance areas', () => {
  it('hands the cast aim to its areas: a damage disc hits a walk-on floor only when the cast aims at it (DEC-322 (1))', () => {
    const { state, factory, caster } = casterState();
    const floor = factory.create('light-mob', 'training-dummy', {
      position: { x: 30, y: 30 },
      team: 'dark',
    });
    floor.addComponent(
      new Footprint(
        [
          [
            { x: 2, y: -4 },
            { x: 10, y: -4 },
            { x: 10, y: 4 },
            { x: 2, y: 4 },
          ],
        ],
        { isWalkOn: true },
      ),
    );
    state.entities.add(floor);
    const hits: string[] = [];
    state.events.on('damage-applied', ({ targetId }) => hits.push(targetId));
    // A 4 m disc on the caster at the origin reaches the floor's west edge at 2 m.
    const disc = {
      kind: 'damage',
      amount: 10,
      damageType: 'physical',
      shape: { kind: 'circle', radius: 4 },
    } as const;

    castSteps(state, caster.id, [disc], { aim: { x: -5, y: 0 } });
    expect(hits).toEqual([]);

    castSteps(state, caster.id, [disc], { aim: { x: 6, y: 0 } });
    expect(hits).toEqual([floor.id]);
  });

  it('points a cone along the cast’s aim and counts its reach from the caster’s body edge (DEC-319)', () => {
    const { state, factory, caster } = casterState();
    const dummyAt = (x: number, y: number) => {
      const dummy = factory.create('light-mob', 'training-dummy', {
        position: { x, y },
        team: 'dark',
      });
      state.entities.add(dummy);
      return dummy;
    };
    // The Warrior's body is 0.5 m: a 2 m fan reaches 2.5 m from its centre, plus a dummy's 0.4 m.
    const east = dummyAt(2.8, 0);
    const west = dummyAt(-2, 0);
    dummyAt(3, 1); // 3.16 m away, 18 degrees off the aim: its body edge is past the fan's reach
    const hits: string[] = [];
    state.events.on('damage-applied', ({ targetId }) => hits.push(targetId));
    const fan = {
      kind: 'damage',
      amount: 10,
      damageType: 'physical',
      shape: { kind: 'cone', reach: 2, arcDegrees: 90 },
    } as const;

    castSteps(state, caster.id, [fan], { aim: { x: 9, y: 0 } });
    expect(hits).toEqual([east.id]);

    castSteps(state, caster.id, [fan], { aim: { x: -9, y: 0 } });
    expect(hits).toEqual([east.id, west.id]);
  });
});
