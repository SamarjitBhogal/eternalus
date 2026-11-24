import { createDefaultGameConfig } from '../../config/defaultGameConfig';
import { ContentCatalogue } from '../../content/ContentCatalogue';
import { loadAbilities } from '../../content/abilities/loadAbilities';
import { loadKnockback } from '../../content/abilities/loadKnockback';
import { createDefaultAbilityRegistry } from '../defaultAbilityRegistry';
import type { AbilityEffect } from '../AbilityEffect.types';
import { AbilityRegistry } from '../AbilityRegistry';
import { KnockbackEffect } from '../effects/KnockbackEffect';
import type { ComposableAbility } from '../AbilityRegistry.types';
import { MinLevelRestriction } from '../restrictions/MinLevelRestriction';
import { CircleShape } from '../shapes/CircleShape';
import { ConeShape } from '../shapes/ConeShape';
import { HitShape } from '../shapes/HitShape';
import { PathShape } from '../shapes/PathShape';
import { DirectionalTargeting } from '../targeting/DirectionalTargeting';
import { HeadingTargeting } from '../targeting/HeadingTargeting';
import { SelfTargeting } from '../targeting/SelfTargeting';

/**
 * The effect kinds the shipped abilities name (S1 content, Fury's `buff`, Hamstring's
 * `projectile`, Rip & Tear's `execute`).
 */
export const SHIPPED_EFFECT_KINDS = [
  'damage',
  'knockback',
  'debuff',
  'dash',
  'buff',
  'projectile',
  'execute',
] as const;

/**
 * The effects the shipped statuses' `onHit` steps name (Fury's knock-back): a match checks them
 * against its registry at boot (`checkStatusLinks`), so a test registry a `Simulation` boots on
 * needs them beside its own. The knock-back is loaded at `tickRate`, the default config's rate
 * unless given.
 */
export const statusOnHitEffects = (
  tickRate = createDefaultGameConfig().tickRate,
): readonly AbilityEffect[] => [new KnockbackEffect(loadKnockback(tickRate))];

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

/**
 * An ability in a kit that is not built yet (S1): no targeting and no effects, so it is
 * unavailable. A fake, so the tests do not break each time a shipped ability gets built.
 */
const FAKE_UNBUILT = fakeAbility({ id: 'fake-unbuilt', targeting: null, effects: [] });

/**
 * The default registry over the shipped abilities plus `FAKE_UNBUILT`, at `tickRate`: a whole
 * match whose kits name an unbuilt slot that stays unbuilt as the shipped abilities get built.
 */
export const shippedRegistryWithUnbuilt = (tickRate = createDefaultGameConfig().tickRate) =>
  createDefaultAbilityRegistry(
    new ContentCatalogue([...loadAbilities(tickRate).all(), FAKE_UNBUILT]),
    tickRate,
  );

/** The shipped abilities (at 30 ticks per second) plus the fakes above. */
export const ABILITIES_WITH_FAKES = new ContentCatalogue<ComposableAbility>([
  ...loadAbilities(30).all(),
  FAKE_STRIKE,
  FAKE_DASH,
  FAKE_ULTIMATE,
  FAKE_GATED,
  FAKE_UNBUILT,
]);

/**
 * A registry over `abilities` with the shipped shapes, restriction and targetings and the given
 * effects, built by hand so the tests do not depend on which effects `createDefaultAbilityRegistry`
 * registers.
 */
export const testAbilityRegistry = (
  effects: readonly AbilityEffect[],
  abilities: ContentCatalogue<ComposableAbility> = ABILITIES_WITH_FAKES,
): AbilityRegistry => {
  const registry = new AbilityRegistry(abilities);
  registry.registerShape(new CircleShape());
  registry.registerShape(new PathShape());
  registry.registerShape(new HitShape());
  registry.registerShape(new ConeShape());
  registry.registerRestriction(new MinLevelRestriction());
  registry.registerTargeting(new SelfTargeting());
  registry.registerTargeting(new DirectionalTargeting());
  registry.registerTargeting(new HeadingTargeting());
  for (const effect of effects) {
    registry.registerEffect(effect);
  }
  return registry;
};
