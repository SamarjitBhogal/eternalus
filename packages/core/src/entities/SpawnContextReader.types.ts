import type { Team } from '../teams/teams.types';
import type { Vec2 } from '../utils/geometry.types';

/** What a spawn context's definition must have so the reader can match it to the entity. */
export type DefinitionRef = {
  readonly id: string;
  readonly kind: string;
};

/** A spawn context for entities that have a place in the world but no team (obstacles). */
export type PositionedSpawnContext<Definition extends DefinitionRef> = {
  /** The definition named by the entity's `definitionId`, matched to its kind by the factory. */
  readonly definition: Definition;
  readonly position: Vec2;
};

/** A spawn context for entities that have a place in the world and a team. */
export type PlacedSpawnContext<Definition extends DefinitionRef> =
  PositionedSpawnContext<Definition> & {
    readonly team: Team;
  };
