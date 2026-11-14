import { describe, expect, it } from 'vitest';

import { loadAbilities } from '../content/abilities/loadAbilities';
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
});
