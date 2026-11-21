import type { CampWeightClass, MapLayout } from '../content/maps/maps.types';
import { distance, distanceToPath } from '../utils/geometry';
import type { Rect, Vec2 } from '../utils/geometry.types';
import { isInLaneFortKeepOut } from './fortInWorld';
import { CAMP_PUSH_MARGIN } from './campPlacement.constants';
import type { CampClearance, CampLayoutInput, CampSlot } from './MapBuilder.types';
import { MapGenerationError } from './MapGenerationError';

/** The box a camp's pieces fill when its centre is `position` and its half size is `extent`. */
const campBox = (position: Vec2, extent: Vec2): Rect => ({
  x: position.x - extent.x,
  y: position.y - extent.y,
  width: 2 * extent.x,
  height: 2 * extent.y,
});

/**
 * Moves a camp the least distance that takes its box off every keep-out (`laneFortKeepOuts`), so
 * the camp keeps all its pieces (DEC-315). Each keep-out offers a step north, south, west and east
 * to its edge; the nearest step that is `isAllowed` and clear of every keep-out wins. A camp that
 * overlaps none stays where it is.
 *
 * @param isAllowed - Where the camp may stand (its corridor, the world).
 * @returns The camp's new centre. A camp no step can clear (a corridor crowded with forts) stays
 *   where it is; `MapSceneryBuilder` then leaves out its pieces that stand in a fort.
 */
export const clearCampOfForts = (
  position: Vec2,
  { keepOuts, extent }: CampClearance,
  isAllowed: (point: Vec2) => boolean,
): Vec2 => {
  if (!isInLaneFortKeepOut(campBox(position, extent), keepOuts)) {
    return position;
  }
  const gapX = extent.x + CAMP_PUSH_MARGIN;
  const gapY = extent.y + CAMP_PUSH_MARGIN;
  const steps = keepOuts.flatMap((hit): readonly Vec2[] => [
    { x: position.x, y: hit.y - gapY },
    { x: position.x, y: hit.y + hit.height + gapY },
    { x: hit.x - gapX, y: position.y },
    { x: hit.x + hit.width + gapX, y: position.y },
  ]);
  const best = steps
    .filter((step) => isAllowed(step) && !isInLaneFortKeepOut(campBox(step, extent), keepOuts))
    .sort((a, b) => distance(a, position) - distance(b, position))[0];
  return best ?? position;
};

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
      const u = band[0] + ((index + (input.rng?.next() ?? 0.5)) / count) * (band[1] - band[0]);
      const x = stronghold.x + u * (centreX - stronghold.x);
      const top = upper.yAtX(x);
      const bottom = lower.yAtX(x);
      const first = { x, y: top + ((index + 1) / (count + 1)) * (bottom - top) };
      const position = clearCampOfForts(
        first,
        input.clearance,
        (point) => upper.yAtX(point.x) < point.y && point.y < lower.yAtX(point.x),
      );
      const width = Math.abs(lower.yAtX(position.x) - upper.yAtX(position.x));
      const nearest = Math.min(...input.lanePaths.map((path) => distanceToPath(position, path)));
      return { corridorIndex, index, position, depth: nearest / (width / 2) };
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
