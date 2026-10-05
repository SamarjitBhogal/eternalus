import type { LaneKnot, MapLayout } from '../content/maps/maps.types';
import { MapGenerationError } from './MapGenerationError';

const isFraction = (value: number): boolean => value >= 0 && value <= 1;
const isBand = ([from, to]: readonly [number, number]): boolean =>
  isFraction(from) && isFraction(to) && from <= to;

/** Every rule a layout must meet, as `[isBroken, message]` pairs. */
const layoutRules = (layout: MapLayout): readonly (readonly [boolean, string])[] => {
  const { laneBands, camps, wallRing, obstacles } = layout;
  const depths = camps.weightClasses.map((weightClass) => weightClass.minDepth);
  return [
    [!isBand(laneBands.spawner), 'laneBands.spawner must be a band inside [0, 1]'],
    [!isBand(laneBands.buff), 'laneBands.buff must be a band inside [0, 1]'],
    [
      laneBands.spawner[0] <= laneBands.buff[1],
      'laneBands.spawner must lie ahead of laneBands.buff',
    ],
    [!isBand(camps.band), 'camps.band must be a band inside [0, 1]'],
    [depths[0] !== 0, 'camps.weightClasses must start at minDepth 0'],
    [
      depths.some((depth, index) => index > 0 && depth <= (depths[index - 1] ?? depth)),
      'camps.weightClasses must be sorted by rising minDepth',
    ],
    [
      layout.laneProfile.some((knot) => !(knot.u > 0 && knot.u < 1)),
      'laneProfile knots need 0 < u < 1',
    ],
    [
      !Number.isInteger(layout.footprintSides) || layout.footprintSides < 3,
      'footprintSides must be a whole number >= 3',
    ],
    [!(layout.navCellSize > 0), 'navCellSize must be > 0'],
    [
      !(wallRing.radius > 0 && wallRing.thickness > 0 && wallRing.maxSegmentArcDegrees > 0),
      'wallRing sizes must be > 0',
    ],
    [
      !(wallRing.exitArcDegrees > 0 && wallRing.exitArcDegrees < 180),
      'wallRing.exitArcDegrees must be between 0 and 180',
    ],
    [
      obstacles.choices.some((choice) => !(choice.weight > 0)),
      'obstacles.choices weights must be > 0',
    ],
  ];
};

/**
 * Rejects a lane profile whose bends are not ordered west to east (`u` strictly rising inside
 * (0, 1)) or whose sideways share `v` is outside [0, 1]. `name` says where the profile came from.
 */
export const validateLaneProfile = (profile: readonly LaneKnot[], name: string): void => {
  const isBroken = profile.some(
    (knot, index) =>
      !(knot.u > 0 && knot.u < 1) ||
      !(knot.v >= 0 && knot.v <= 1) ||
      knot.u <= (profile[index - 1]?.u ?? 0),
  );
  if (isBroken) {
    throw new MapGenerationError(
      `Invalid map layout: ${name} needs 0 < u < 1 rising from bend to bend and 0 <= v <= 1`,
    );
  }
};

/**
 * Rejects map layout content the generator cannot honour, naming the field and the rule, so a
 * content typo fails before any map is built.
 */
export const validateMapLayout = (layout: MapLayout): void => {
  validateLaneProfile(layout.laneProfile, 'laneProfile');
  const problems = layoutRules(layout)
    .filter(([isBroken]) => isBroken)
    .map(([, message]) => message);
  if (problems.length > 0) {
    throw new MapGenerationError(`Invalid map layout: ${problems.join('; ')}`);
  }
};
