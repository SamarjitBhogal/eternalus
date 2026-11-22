import type { StructureAuraDefinition } from '../content/structures/structures.types';
import type { EntityId } from '../state/EntityStore.types';
import type { PlayableTeam } from '../teams/teams.types';
import type { Rect } from '../utils/geometry.types';

/**
 * One living aura source this pass: who it is, its side, its aura and the box its radius is
 * measured beyond (`outlineBoxOf`: its outline box, or a box of no size at its centre; DEC-323 (3)).
 */
export type AuraSource = {
  readonly id: EntityId;
  readonly team: PlayableTeam;
  readonly aura: StructureAuraDefinition;
  readonly box: Rect;
};
