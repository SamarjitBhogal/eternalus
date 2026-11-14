import { describe, expect, it } from 'vitest';

import { BLADE_RUNNER } from '../content/abilities/bladeRunner';
import { loadAbilities } from '../content/abilities/loadAbilities';
import { SHOCKWAVE } from '../content/abilities/shockwave';
import { SLAM } from '../content/abilities/slam';
import { ContentCatalogue } from '../content/ContentCatalogue';
import { ContentValidationError } from '../content/ContentValidationError';
import { fakeAbility, SHIPPED_EFFECT_KINDS } from './__fixtures__/fakeAbilities';
import { createDefaultAbilityRegistry } from './defaultAbilityRegistry';

/** A damage step with a shape kind the default registry has no line for. */
const CONE_DAMAGE = { kind: 'damage', shape: { kind: 'cone' } } as const;

describe('createDefaultAbilityRegistry', () => {
  it('composes every shipped ability at build: every shape and restriction kind is registered', () => {
    const abilities = loadAbilities(30);
    const registry = createDefaultAbilityRegistry(abilities);

    expect(abilities.ids.map((id) => registry.resolve(id).id)).toEqual(abilities.ids);
    expect(registry.shapeFor('circle').kind).toBe('circle');
    expect(registry.shapeFor('path').kind).toBe('path');
  });

  it('makes every shipped ability with effects available: every effect kind it names is registered', () => {
    const abilities = loadAbilities(30);
    const registry = createDefaultAbilityRegistry(abilities);

    expect(abilities.ids.filter((id) => registry.resolve(id).isAvailable)).toEqual([
      'blade-runner',
      'slam',
      'shockwave',
    ]);
    expect(SHIPPED_EFFECT_KINDS.map((kind) => registry.effectFor(kind).kind)).toEqual(
      SHIPPED_EFFECT_KINDS,
    );
  });

  it('fails at build, not at cast, when an ability names a shape kind it has no line for', () => {
    const abilities = new ContentCatalogue([
      fakeAbility({ id: 'cone-strike', effects: [CONE_DAMAGE] }),
    ]);

    expect(() => createDefaultAbilityRegistry(abilities)).toThrow(ContentValidationError);
  });

  it('fails at build, not at cast, when an ability names an effect kind it has no line for', () => {
    const abilities = new ContentCatalogue([
      fakeAbility({ id: 'bolt', effects: [{ kind: 'zone' }] }),
    ]);

    expect(() => createDefaultAbilityRegistry(abilities)).toThrow(ContentValidationError);
    expect(() => createDefaultAbilityRegistry(abilities)).toThrow('effect "zone"');
  });

  it('fails at build on every step and shape its strategy refuses, nested ones included', () => {
    const abilities = loadAbilities(30, [
      {
        ...SHOCKWAVE,
        id: 'ghost',
        effects: [{ kind: 'debuff', statusId: 'frozen', shape: { kind: 'circle', radius: 0 } }],
      },
      {
        ...SLAM,
        id: 'bad-numbers',
        effects: [
          {
            kind: 'damage',
            amount: 0,
            damageType: 'physical',
            shape: { kind: 'circle', radius: 1 },
            structureMultiplier: -1,
          },
          { kind: 'knockback', distance: 0, shape: { kind: 'circle', radius: 1 } },
          { kind: 'dash', distance: 0, durationSeconds: 0, onPath: [], onEnd: [] },
        ],
      },
      {
        ...BLADE_RUNNER,
        id: 'lunge',
        effects: [
          {
            kind: 'dash',
            distance: 8,
            durationSeconds: 0.3,
            onPath: [
              {
                kind: 'debuff',
                statusId: 'frozen',
                durationSeconds: 0,
                shape: { kind: 'path', width: 0 },
              },
            ],
            onEnd: [],
          },
        ],
      },
    ]);

    expect(() => createDefaultAbilityRegistry(abilities)).toThrow(ContentValidationError);
    expect(() => createDefaultAbilityRegistry(abilities)).toThrow(
      new ContentValidationError(
        [
          'Ability "ghost": debuff status "frozen" is unknown.',
          'Ability "ghost": circle radius must be positive.',
          'Ability "bad-numbers": damage amount must be positive.',
          'Ability "bad-numbers": structureMultiplier must not be negative.',
          'Ability "bad-numbers": knockback distance must be positive.',
          'Ability "bad-numbers": dash distance must be positive.',
          'Ability "bad-numbers": dash duration must be positive.',
          'Ability "lunge": debuff status "frozen" is unknown.',
          'Ability "lunge": debuff duration must be positive.',
          'Ability "lunge": path width must be positive.',
        ].join('\n'),
      ),
    );
  });

  it('checks a debuff against the statuses it is given', () => {
    expect(() => createDefaultAbilityRegistry(loadAbilities(30), { has: () => false })).toThrow(
      'Ability "shockwave": debuff status "concussion" is unknown.',
    );
  });
});
