import { describe, expect, it } from 'vitest';

import { ContentCatalogue } from '../content/ContentCatalogue';
import { ContentValidationError } from '../content/ContentValidationError';
import { UnknownDefinitionError } from '../content/UnknownDefinitionError';
import { RecordingEffect } from './__fixtures__/RecordingEffect';
import {
  ABILITIES_WITH_FAKES,
  fakeAbility,
  SHIPPED_EFFECT_KINDS,
  testAbilityRegistry,
} from './__fixtures__/fakeAbilities';
import { AbilityRegistry } from './AbilityRegistry';
import { MinLevelRestriction } from './restrictions/MinLevelRestriction';
import { CircleShape } from './shapes/CircleShape';

/** A step with a shape kind no registry line covers. */
const CONE_STRIKE_STEP = { kind: 'fake-strike', shape: { kind: 'cone' } } as const;

describe('AbilityRegistry', () => {
  it('binds each effect step to its strategy, in order, and each restriction to its rule', () => {
    const strike = new RecordingEffect('fake-strike');
    const registry = testAbilityRegistry([strike]);

    const gated = registry.resolve('fake-gated');

    expect(gated.isAvailable).toBe(true);
    expect(gated.steps).toEqual([{ effect: strike, spec: { kind: 'fake-strike' } }]);
    expect(gated.restrictions.map(({ spec }) => spec)).toEqual([{ kind: 'min-level', level: 5 }]);
    expect(gated.restrictions[0]?.rule).toBeInstanceOf(MinLevelRestriction);
    expect(gated.definition).toBe(ABILITIES_WITH_FAKES.get('fake-gated'));
  });

  it('composes each ability once (a cached Flyweight) until a strategy is registered', () => {
    const registry = testAbilityRegistry([new RecordingEffect('fake-strike')]);
    const before = registry.resolve('fake-strike');
    expect(registry.resolve('fake-strike')).toBe(before);

    registry.registerEffect(new RecordingEffect('fake-other'));

    expect(registry.resolve('fake-strike')).not.toBe(before);
    expect(registry.resolve('fake-strike').isAvailable).toBe(true);
  });

  it('makes an ability with no effects (not built, S1) unavailable', () => {
    const veil = testAbilityRegistry([]).resolve('veil');
    expect(veil).toMatchObject({ isAvailable: false, steps: [] });
  });

  it('fails loudly on an effect kind with no strategy, nested ones included (no more unavailable interim)', () => {
    const registry = testAbilityRegistry(
      SHIPPED_EFFECT_KINDS.filter((kind) => kind !== 'knockback').map(
        (kind) => new RecordingEffect(kind),
      ),
    );

    // Blade Runner's knockback is nested in its dash; Shockwave's is a step of its own.
    expect(() => registry.resolve('blade-runner')).toThrow(ContentValidationError);
    expect(() => registry.resolve('blade-runner')).toThrow('effect "knockback"');
    expect(() => registry.resolve('shockwave')).toThrow('effect "knockback"');

    registry.registerEffect(new RecordingEffect('knockback'));

    expect(registry.resolve('blade-runner').isAvailable).toBe(true);
    expect(registry.resolve('shockwave').steps.map(({ spec }) => spec.kind)).toEqual([
      'damage',
      'knockback',
      'debuff',
    ]);
  });

  it('fails loudly on a shape or restriction kind with no strategy (a typo or a missing registry line)', () => {
    const abilities = new ContentCatalogue([
      fakeAbility({ id: 'cone-strike', effects: [CONE_STRIKE_STEP] }),
      fakeAbility({ id: 'carry-strike', restrictions: [{ kind: 'not-while-carrying' }] }),
    ]);
    const registry = testAbilityRegistry([new RecordingEffect('fake-strike')], abilities);

    expect(() => registry.resolve('cone-strike')).toThrow(ContentValidationError);
    expect(() => registry.resolve('cone-strike')).toThrow('shape "cone"');
    expect(() => registry.resolve('carry-strike')).toThrow('restriction "not-while-carrying"');
    expect(() => {
      registry.resolveAll();
    }).toThrow(ContentValidationError);
  });

  it('rejects an unknown ability id', () => {
    expect(() => testAbilityRegistry([]).resolve('fireball')).toThrow(UnknownDefinitionError);
  });

  it('refuses a second strategy for the same kind', () => {
    const registry = new AbilityRegistry(ABILITIES_WITH_FAKES);
    registry.registerShape(new CircleShape());
    registry.registerEffect(new RecordingEffect('damage'));
    registry.registerRestriction(new MinLevelRestriction());

    expect(() => {
      registry.registerShape(new CircleShape());
    }).toThrow('shape kind "circle" is already registered');
    expect(() => {
      registry.registerEffect(new RecordingEffect('damage'));
    }).toThrow('effect kind "damage"');
    expect(() => {
      registry.registerRestriction(new MinLevelRestriction());
    }).toThrow('restriction kind "min-level"');
  });

  it('looks strategies up by kind, and fails loudly on a kind it does not have', () => {
    const strike = new RecordingEffect('fake-strike');
    const registry = testAbilityRegistry([strike]);

    expect(registry.effectFor('fake-strike')).toBe(strike);
    expect(registry.shapeFor('path').kind).toBe('path');
    expect(() => registry.effectFor('fake-bolt')).toThrow('No effect strategy');
    expect(() => registry.shapeFor('cone')).toThrow('No shape strategy');
  });
});
