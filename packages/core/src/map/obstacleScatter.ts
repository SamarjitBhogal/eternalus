import type { MapLayout, ObstacleChoice } from '../content/maps/maps.types';
import { distance, distanceToPath, isPointInPolygon } from '../utils/geometry';
import type { Polygon, Vec2 } from '../utils/geometry.types';
import type { ObstacleSlot } from './MapBuilder.types';
import type { Rng } from './Rng.types';

/** What scattered obstacles must keep clear of. */
export type ScatterArea = {
  readonly width: number;
  readonly height: number;
  readonly blocked: readonly Polygon[];
  readonly lanes: readonly (readonly Vec2[])[];
  readonly occupied: readonly Vec2[];
  readonly keepOut: readonly { readonly centre: Vec2; readonly radius: number }[];
};

const pickChoice = (roll: number, choices: readonly ObstacleChoice[]): string | undefined => {
  const total = choices.reduce((sum, choice) => sum + choice.weight, 0);
  let remaining = roll * total;
  return choices.find((choice) => {
    remaining -= choice.weight;
    return remaining < 0;
  })?.definitionId;
};

/**
 * Scatters obstacles over the Light half with the seeded RNG. Every sample draws exactly three
 * numbers whether or not it is kept, so the output depends only on the seed and the inputs.
 * Samples inside terrain, near a lane, near a feature or near another obstacle are rejected.
 */
export const scatterObstacles = (
  rng: Rng,
  area: ScatterArea,
  rules: MapLayout['obstacles'],
): readonly ObstacleSlot[] => {
  const halfWidth = area.width / 2;
  const samples = Math.round((rules.perTenThousandUnits * halfWidth * area.height) / 10_000);
  const placed: ObstacleSlot[] = [];
  for (let sample = 0; sample < samples; sample += 1) {
    const position = { x: rng.next() * halfWidth, y: rng.next() * area.height };
    const definitionId = pickChoice(rng.next(), rules.choices);
    const isClear =
      position.x < halfWidth - rules.featureClearance &&
      !area.blocked.some((polygon) => isPointInPolygon(position, polygon)) &&
      area.lanes.every((lane) => distanceToPath(position, lane) >= rules.laneClearance) &&
      [...area.occupied, ...placed.map((slot) => slot.position)].every(
        (other) => distance(position, other) >= rules.featureClearance,
      ) &&
      area.keepOut.every((zone) => distance(position, zone.centre) >= zone.radius);
    if (isClear && definitionId !== undefined) {
      placed.push({ definitionId, position });
    }
  }
  return placed;
};
