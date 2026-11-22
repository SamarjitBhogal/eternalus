import type { AuthoredAbility } from '../abilities/AbilityDefinition.types';

/**
 * An artifact as authored (05 §11 `ArtifactDefinition`): an ability that fills a gadget slot.
 * `satisfies AuthoredArtifact` checks the slot kind at compile time.
 */
export type AuthoredArtifact = AuthoredAbility & { readonly slot: 'gadget' };
