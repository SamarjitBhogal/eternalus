/**
 * Gives each of a team's bot laners a lane at match setup (architecture 18 §8, MS-20): in the
 * order given, each goes to the lane with the fewest Legends so far, the lowest index first, so
 * the lanes fill evenly up to `legendsPerLane` each. `occupied` counts Legends already on a lane
 * (the human's, when the human is a laner); the Rover takes no lane and is never passed in.
 *
 * @param laners - How many bot laners the team has.
 * @param laneIds - The lanes in `MapLane.index` order.
 * @param occupied - Legends already on each lane, by lane id.
 * @returns One lane id per laner, in order.
 */
export const assignLanes = (
  laners: number,
  laneIds: readonly string[],
  occupied: Readonly<Record<string, number>> = {},
): readonly string[] => {
  const counts = laneIds.map((id) => occupied[id] ?? 0);
  return Array.from({ length: laners }, () => {
    const fewest = counts.indexOf(Math.min(...counts));
    counts[fewest] = (counts[fewest] ?? 0) + 1;
    return laneIds[fewest] ?? '';
  });
};
