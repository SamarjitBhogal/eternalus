import type { Entity } from '../entities/Entity';
import type { Placement } from '../entities/EntityFactory.types';

/** Entity-construction port on the match boundary; effects do not import an entity factory. */
export type AbilitySpawn = (definitionId: string, placement: Placement) => Entity;
