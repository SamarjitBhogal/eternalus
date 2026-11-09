import type { MapDefinition } from '../content/maps/maps.types';
import { LANE_CAMP_THEMES } from '../content/maps/campScenery';
import type { CampTheme } from './MapCampBuilder.types';
import { distance } from '../utils/geometry';

/** Visual lane themes ordered from the home base: heavy, medium, then light. */
export const laneCampThemes = (map: MapDefinition): ReadonlyMap<string, CampTheme> => {
  const themes = new Map<string, CampTheme>();
  for (const home of map.features.filter((feature) => feature.kind === 'stronghold')) {
    for (const lane of map.lanes) {
      const camps = map.features
        .filter(
          (feature) =>
            feature.team === home.team &&
            feature.laneId === lane.id &&
            (feature.kind === 'spawner-tower' || feature.kind === 'buff-tower'),
        )
        .sort((a, b) => distance(a.position, home.position) - distance(b.position, home.position));
      camps.forEach((camp, index) => {
        themes.set(
          camp.id,
          LANE_CAMP_THEMES[Math.min(index, LANE_CAMP_THEMES.length - 1)] ?? 'light',
        );
      });
    }
  }
  return themes;
};
