/**
 * Gives each of a team's bot laners a lane at match setup (architecture 18 §8, MS-20): in the
 * order given, each goes to the lane with the fewest Legends so far, the lowest index first, so
 * the lanes fill evenly up to `legendsPerLane` each. `occupied` counts Legends already on a lane:
 * a human laner in sim or developer mode (11 §7); the Rover takes no lane and is never counted.
 *
 * @param laners - How many bot laners the team has.
 * @param laneIds - The lanes in `MapLane.index` order.
 * @param legendsPerLane - At most this many Legends on one lane.
 * @param occupied - Legends already on each lane, by lane id.
 * @returns One lane id per laner, in order.
 * @throws Error when the laners do not fit under `legendsPerLane`.
 */
export const assignLanes = (
  laners: number,
  laneIds: readonly string[],
  legendsPerLane: number,
  occupied: Readonly<Record<string, number>> = {},
): readonly string[] => {
  const counts = laneIds.map((id) => occupied[id] ?? 0);
  const room = counts.reduce((free, count) => free + Math.max(0, legendsPerLane - count), 0);
  if (laners > room) {
    throw new Error(
      `${String(laners)} bot laners do not fit on ${String(laneIds.length)} lanes of ${String(legendsPerLane)} Legends.`,
    );
  }
  return Array.from({ length: laners }, () => {
    const fewest = counts.indexOf(Math.min(...counts));
    counts[fewest] = (counts[fewest] ?? 0) + 1;
    return laneIds[fewest] ?? '';
  });
};
