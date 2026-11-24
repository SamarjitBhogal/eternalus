import { ContentCatalogue } from '../ContentCatalogue';
import type { ObstacleDefinition } from './obstacles.types';
import { SHIELD_WALL_BARRIER } from './shieldWallBarrier';

/**
 * Every obstacle placed during the match, by id (07 §9): a new one is a file and a line here. The
 * map's own objects have their definitions in `content/maps/mapObjectDefinitions.ts`.
 */
export const OBSTACLE_DEFINITIONS = new ContentCatalogue<ObstacleDefinition>([SHIELD_WALL_BARRIER]);
