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
import { DirectionalTargeting } from './targeting/DirectionalTargeting';
import { HeadingTargeting } from './targeting/HeadingTargeting';

/** A step with a shape kind no registry line covers. */
const RING_STRIKE_STEP = { kind: 'fake-strike', shape: { kind: 'ring' } } as const;
/** A strike on the one body just struck: valid only in an `onHit` list (HC-B26 (5)). */
const HIT_STRIKE = { kind: 'fake-strike', shape: { kind: 'hit' } } as const;
/** The problem a `hit` outside an `onHit` list reports. */
const HIT_OUTSIDE_ON_HIT =
  'a "hit" shape holds a body only in an onHit list (a shot\'s or a status\'s)';

describe('AbilityRegistry', () => {
  it('binds each effect step to its strategy, in order, and each restriction to its rule', () => {
    const strike = new RecordingEffect('fake-strike');
    const registry = testAbilityRegistry([strike]);

    const gated = registry.resolve('fake-gated');

    expect(gated.isAvailable).toBe(true);
    expect(gated.steps).toEqual([{ effect: strike, spec: { kind: 'fake-strike' }, delayTicks: 0 }]);
    expect(gated.restrictions.map(({ spec }) => spec)).toEqual([{ kind: 'min-level', level: 5 }]);
    expect(gated.restrictions[0]?.rule).toBeInstanceOf(MinLevelRestriction);
    expect(gated.definition).toBe(ABILITIES_WITH_FAKES.get('fake-gated'));
  });

  it('binds the targeting to its strategy by kind; an ability with no targeting (not built) has none', () => {
    const registry = testAbilityRegistry([
      new RecordingEffect('fake-strike'),
      new RecordingEffect('dash'),
      new RecordingEffect('buff'),
    ]);

    const dash = registry.resolve('fake-dash').targeting;
    const furyDash = registry.resolve('fury-dash').targeting;

    expect(dash?.strategy).toBeInstanceOf(DirectionalTargeting);
    expect(dash?.spec).toEqual({ kind: 'directional' });
    expect(furyDash?.strategy).toBeInstanceOf(HeadingTargeting);
    expect(furyDash?.spec).toEqual({ kind: 'heading' });
    expect(registry.resolve('fake-unbuilt').targeting).toBeNull();
  });

  it('binds each step with its delay after the cast, 0 for a step with none (05 §4)', () => {
    const registry = testAbilityRegistry([
      new RecordingEffect('dash'),
      new RecordingEffect('buff'),
    ]);

    const steps = registry.resolve('fury-dash').steps;

    expect(steps.map(({ spec, delayTicks }) => `${spec.kind} ${String(delayTicks)}`)).toEqual([
      'buff 0',
      'dash 9',
    ]);
  });

  it('composes each ability once (a cached Flyweight), and a later registration changes none', () => {
    const strike = new RecordingEffect('fake-strike');
    const registry = testAbilityRegistry([strike]);
    const before = registry.resolve('fake-strike');
    expect(registry.resolve('fake-strike')).toBe(before);

    // A kind is registered once (see "refuses a second strategy"), so a later registration only
    // adds a kind that no resolved ability names: the cached composition stays the right one.
    registry.registerEffect(new RecordingEffect('fake-other'));

    expect(registry.resolve('fake-strike')).toBe(before);
    expect(before.steps).toEqual([
      { effect: strike, spec: { kind: 'fake-strike' }, delayTicks: 0 },
    ]);
    expect(() => {
      registry.registerEffect(new RecordingEffect('fake-strike'));
    }).toThrow('effect kind "fake-strike" is already registered');
  });

  it('checks each step once when it resolves every ability at boot (critic r2 N-1)', () => {
    const checked: string[] = [];
    /** A strike that notes each step it is asked to check. */
    class CountingStrike extends RecordingEffect {
      public override validate(): readonly string[] {
        checked.push(this.kind);
        return [];
      }
    }
    const registry = testAbilityRegistry(
      [new CountingStrike('fake-strike')],
      new ContentCatalogue([fakeAbility({ id: 'one-strike', effects: [{ kind: 'fake-strike' }] })]),
    );

    registry.resolveAll();

    expect(checked).toEqual(['fake-strike']);
    expect(registry.resolve('one-strike').steps).toHaveLength(1);
  });

  it('makes an ability with no effects (not built, S1) unavailable', () => {
    const unbuilt = testAbilityRegistry([]).resolve('fake-unbuilt');
    expect(unbuilt).toMatchObject({ isAvailable: false, steps: [] });
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
      fakeAbility({ id: 'ring-strike', effects: [RING_STRIKE_STEP] }),
      fakeAbility({ id: 'carry-strike', restrictions: [{ kind: 'not-while-carrying' }] }),
    ]);
    const registry = testAbilityRegistry([new RecordingEffect('fake-strike')], abilities);

    expect(() => registry.resolve('ring-strike')).toThrow(ContentValidationError);
    expect(() => registry.resolve('ring-strike')).toThrow('shape "ring"');
    expect(() => registry.resolve('carry-strike')).toThrow('restriction "not-while-carrying"');
    expect(() => {
      registry.resolveAll();
    }).toThrow(ContentValidationError);
  });

  it('fails loudly on a targeting kind with no strategy (a typo or a missing registry line)', () => {
    const abilities = new ContentCatalogue([
      fakeAbility({ id: 'aimed-strike', targeting: { kind: 'aimed' } }),
    ]);
    const registry = testAbilityRegistry([new RecordingEffect('fake-strike')], abilities);

    expect(() => registry.resolve('aimed-strike')).toThrow(ContentValidationError);
    expect(() => registry.resolve('aimed-strike')).toThrow(
      'Ability "aimed-strike" names targeting "aimed" with no registered strategy',
    );
    expect(() => {
      registry.resolveAll();
    }).toThrow('targeting "aimed"');
  });

  it('checks steps outside an ability under their owner’s name, nested ones included (a status’s onHit)', () => {
    const registry = testAbilityRegistry([
      new RecordingEffect('fake-strike'),
      new RecordingEffect('dash'),
    ]);
    const dash = {
      kind: 'dash',
      distance: 3,
      durationTicks: 9,
      onPath: [],
      onEnd: [{ kind: 'knockback', distance: 1, shape: { kind: 'ring' } }],
    } as const;
    const onHit = { isOnHit: true };

    expect(registry.checkSteps('Status "fury" onHit', [{ kind: 'fake-strike' }], onHit)).toEqual(
      [],
    );
    expect(registry.checkSteps('Status "fury" onHit', [dash], onHit)).toEqual([
      'Status "fury" onHit names effect "knockback", shape "ring" with no registered strategy (defaultAbilityRegistry.ts).',
    ]);
  });

  it("allows a \"hit\" area only in an onHit list: a shot's or a status's, not a cast's or a dash's (HC-B26 (5))", () => {
    const shot = { kind: 'projectile', projectileId: 'bolt', onHit: [HIT_STRIKE] } as const;
    const dash = { kind: 'dash', distance: 3, durationTicks: 9, onPath: [], onEnd: [HIT_STRIKE] };
    const abilities = new ContentCatalogue([
      fakeAbility({ id: 'shot-strike', effects: [shot] }),
      fakeAbility({ id: 'cast-strike', effects: [HIT_STRIKE] }),
      fakeAbility({ id: 'dash-strike', effects: [dash] }),
    ]);
    const registry = testAbilityRegistry(
      [
        new RecordingEffect('fake-strike'),
        new RecordingEffect('projectile'),
        new RecordingEffect('dash'),
      ],
      abilities,
    );

    expect(registry.resolve('shot-strike').isAvailable).toBe(true);
    expect(() => registry.resolve('cast-strike')).toThrow(
      `Ability "cast-strike": ${HIT_OUTSIDE_ON_HIT}.`,
    );
    expect(() => registry.resolve('dash-strike')).toThrow(
      `Ability "dash-strike": ${HIT_OUTSIDE_ON_HIT}.`,
    );
    expect(registry.checkSteps('Status "fury" onHit', [HIT_STRIKE], { isOnHit: true })).toEqual([]);
    expect(registry.checkSteps('Status "fury" onHit', [dash], { isOnHit: true })).toEqual([
      `Status "fury" onHit: ${HIT_OUTSIDE_ON_HIT}.`,
    ]);
  });

  it('rejects an unknown ability id', () => {
    expect(() => testAbilityRegistry([]).resolve('fireball')).toThrow(UnknownDefinitionError);
  });

  it('refuses a second strategy for the same kind', () => {
    const registry = new AbilityRegistry(ABILITIES_WITH_FAKES);
    registry.registerShape(new CircleShape());
    registry.registerEffect(new RecordingEffect('damage'));
    registry.registerRestriction(new MinLevelRestriction());
    registry.registerTargeting(new HeadingTargeting());

    expect(() => {
      registry.registerShape(new CircleShape());
    }).toThrow('shape kind "circle" is already registered');
    expect(() => {
      registry.registerTargeting(new HeadingTargeting());
    }).toThrow('targeting kind "heading"');
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
    expect(() => registry.shapeFor('ring')).toThrow('No shape strategy');
  });

  it('tells from the bound targeting strategy whether a cast uses the aim', () => {
    const registry = testAbilityRegistry([]);

    expect(registry.usesAim({ kind: 'heading' })).toBe(false);
    expect(registry.usesAim({ kind: 'directional' })).toBe(true);
    expect(registry.usesAim(null)).toBe(true);
    expect(() => registry.usesAim({ kind: 'beam' })).toThrow('No targeting strategy');
  });
});
