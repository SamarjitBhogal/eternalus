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
});
