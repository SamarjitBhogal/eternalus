import { MapGenerationError } from './MapGenerationError';
import type { MapConfig } from './MapGenerator.types';

const isCount = (value: number): boolean => Number.isInteger(value) && value >= 0;

/**
 * Rejects map configs the generator cannot honour, naming the field and the rule.
 *
 * TODO(sholtzman): fold into session B's `validateGameConfig()` once it lands.
 */
export const validateMapConfig = (config: MapConfig): void => {
  const problems: string[] = [];
  if (!Number.isInteger(config.numLanes) || config.numLanes < 1 || config.numLanes % 2 === 0) {
    problems.push(
      'map.numLanes must be an odd whole number >= 1 (the Cathedral needs a middle lane)',
    );
  }
  const counts = [
    'spawnTowersPerLane',
    'buffTowersPerLane',
    'campsPerSide',
    'cornerCamps',
  ] as const;
  for (const field of counts) {
    if (!isCount(config[field])) {
      problems.push(`map.${field} must be a whole number >= 0`);
    }
  }
  if (config.cornerCamps % 2 !== 0) {
    problems.push('map.cornerCamps must be even (corner camps are mirrored)');
  }
  if (config.campsPerSide > 0 && config.numLanes < 2) {
    problems.push('map.campsPerSide must be 0 with one lane (camps sit between lanes)');
  }
  if (!(config.worldWidth > 0) || !(config.worldHeight > 0)) {
    problems.push('map.worldWidth and map.worldHeight must be > 0');
  }
  if (problems.length > 0) {
    throw new MapGenerationError(`Invalid map config: ${problems.join('; ')}`);
  }
};
