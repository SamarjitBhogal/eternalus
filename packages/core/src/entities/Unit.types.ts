import type { UnitDefinition } from '../content/units/units.types';
import type { PlacedSpawnContext } from './SpawnContextReader.types';

/** What a unit needs to spawn: its definition, where it appears and which team it fights for. */
export type UnitSpawnContext = PlacedSpawnContext<UnitDefinition>;
