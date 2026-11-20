import { ContentCatalogue } from '../../content/ContentCatalogue';
import { loadAbilities } from '../../content/abilities/loadAbilities';
import type { AbilityEffect } from '../AbilityEffect.types';
import { AbilityRegistry } from '../AbilityRegistry';
import type { ComposableAbility } from '../AbilityRegistry.types';
import { MinLevelRestriction } from '../restrictions/MinLevelRestriction';
import { CircleShape } from '../shapes/CircleShape';
import { PathShape } from '../shapes/PathShape';

/** The effect kinds the shipped abilities name (S1 content). */
export const SHIPPED_EFFECT_KINDS = ['damage', 'knockback', 'debuff', 'dash'] as const;

/** A Warrior ability for tests: 30 aether, a 90-tick cooldown, one `fake-strike` step around the caster. */
export const fakeAbility = (
  overrides: Partial<ComposableAbility> & { readonly id: string },
): ComposableAbility => ({
  displayName: overrides.id,
  description: 'A test ability.',
  classId: 'warrior',
  slot: 'ability',
  aetherCost: 30,
  cooldownTicks: 90,
  targeting: { kind: 'self' },
  effects: [{ kind: 'fake-strike' }],
  restrictions: [],
  scaling: {},
  ...overrides,
});

/** A self-centred strike. */
export const FAKE_STRIKE = fakeAbility({ id: 'fake-strike' });

/** A dash: it needs an aim direction. */
const FAKE_DASH = fakeAbility({ id: 'fake-dash', targeting: { kind: 'directional' } });

/** An ultimate with an effect, gated by the meter. */
const FAKE_ULTIMATE = fakeAbility({
  id: 'fake-ultimate',
  slot: 'ultimate',
  aetherCost: 0,
  cooldownTicks: 0,
});

const MIN_LEVEL_5 = { kind: 'min-level', level: 5 } as const;

/** A strike only a level-5 caster may cast. */
const FAKE_GATED = fakeAbility({ id: 'fake-gated', restrictions: [MIN_LEVEL_5] });

/** The shipped abilities (at 30 ticks per second) plus the fakes above. */
export const ABILITIES_WITH_FAKES = new ContentCatalogue<ComposableAbility>([
  ...loadAbilities(30).all(),
  FAKE_STRIKE,
  FAKE_DASH,
  FAKE_ULTIMATE,
  FAKE_GATED,
]);

/**
 * A registry over `abilities` with the shipped shapes and restriction and the given effects, built
 * by hand so the tests do not depend on which effects `createDefaultAbilityRegistry` registers.
 */
export const testAbilityRegistry = (
  effects: readonly AbilityEffect[],
  abilities: ContentCatalogue<ComposableAbility> = ABILITIES_WITH_FAKES,
): AbilityRegistry => {
  const registry = new AbilityRegistry(abilities);
  registry.registerShape(new CircleShape());
  registry.registerShape(new PathShape());
  registry.registerRestriction(new MinLevelRestriction());
  for (const effect of effects) {
    registry.registerEffect(effect);
  }
  return registry;
};
