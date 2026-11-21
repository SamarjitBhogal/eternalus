import type { StructureAuraDefinition } from '../content/structures/structures.types';
import type { EntityId } from '../state/EntityStore.types';
import type { PlayableTeam } from '../teams/teams.types';

/** One living aura source this pass: who it is, its side, its aura and where it stands. */
export type AuraSource = {
  readonly id: EntityId;
  readonly team: PlayableTeam;
  readonly aura: StructureAuraDefinition;
  readonly x: number;
  readonly y: number;
};
