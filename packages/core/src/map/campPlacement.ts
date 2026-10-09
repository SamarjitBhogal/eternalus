import type { CampWeightClass, MapLayout } from '../content/maps/maps.types';
import { distanceToPath } from '../utils/geometry';
import type { Vec2 } from '../utils/geometry.types';
import type { CampLayoutInput, CampSlot } from './MapBuilder.types';
import { MapGenerationError } from './MapGenerationError';

/**
 * Splits `total` camps over `corridors` corridors as evenly as possible. Leftover camps go to
 * the corridors nearest the middle first, so any lane count works with any camp count.
 */
export const distributeCamps = (total: number, corridors: number): readonly number[] => {
  if (corridors <= 0) {
    return [];
  }
  const base = Math.floor(total / corridors);
  const middle = (corridors - 1) / 2;
  const byCentrality = Array.from({ length: corridors }, (_, index) => index).sort(
    (a, b) => Math.abs(a - middle) - Math.abs(b - middle) || a - b,
  );
  const extra = new Set(byCentrality.slice(0, total % corridors));
  return Array.from({ length: corridors }, (_, index) => base + (extra.has(index) ? 1 : 0));
};

/**
 * Camp spots on the Light half. Corridor `c` lies between lanes `c` and `c + 1`; its camps are
 * spread east-west across `band` and step from one lane towards the other, so some sit near a
 * lane and some deep in the Unknown. `depth` is the distance to the nearest lane divided by
 * half the corridor's width there (0 at a lane, 1 in the middle).
 */
export const placeCampSlots = (input: CampLayoutInput): readonly CampSlot[] =>
  input.counts.flatMap((count, corridorIndex) => {
    const upper = input.lightHalves[corridorIndex];
    const lower = input.lightHalves[corridorIndex + 1];
    if (upper === undefined || lower === undefined) {
      throw new MapGenerationError(`Corridor ${String(corridorIndex)} has no lane on one side`);
    }
    const { band, stronghold, centreX } = input;
    return Array.from({ length: count }, (_, index): CampSlot => {
      const u = band[0] + ((index + 0.5) / count) * (band[1] - band[0]);
      const x = stronghold.x + u * (centreX - stronghold.x);
      const top = upper.yAtX(x);
      const bottom = lower.yAtX(x);
      const position = { x, y: top + ((index + 1) / (count + 1)) * (bottom - top) };
      const nearest = Math.min(...input.lanePaths.map((path) => distanceToPath(position, path)));
      return { corridorIndex, index, position, depth: nearest / (Math.abs(bottom - top) / 2) };
    });
  });

/** The heaviest camp class whose `minDepth` the depth reaches (DISC-42: deeper = heavier). */
export const campDefinitionFor = (
  depth: number,
  classes: readonly CampWeightClass[],
): string | undefined =>
  classes.filter((weightClass) => depth >= weightClass.minDepth).at(-1)?.definitionId;

/**
 * Corner camp spots on the Light half: alternately the top and bottom corner, stepping inwards
 * after each pair. `count` is the total for both halves (validated even).
 */
export const cornerCampPositions = (
  count: number,
  corner: MapLayout['cornerCamps'],
  worldHeight: number,
): readonly Vec2[] =>
  Array.from({ length: count / 2 }, (_, index) => ({
    x: corner.insetX + Math.floor(index / 2) * corner.stepX,
    y: index % 2 === 0 ? corner.insetY : worldHeight - corner.insetY,
  }));
