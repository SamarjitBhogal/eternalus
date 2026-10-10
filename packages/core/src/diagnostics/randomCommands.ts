import type { Command } from '../commands/Command.types';
import type { Snapshot } from '../state/Snapshot.types';
import type { Rng } from '../utils/Rng.types';

/** Share of commands aimed at a live entity; the rest name an id that does not exist. */
const LIVE_TARGET_SHARE = 0.9;
/** Highest made-up entity number for commands aimed at a missing entity. */
const MISSING_ID_RANGE = 1000;
/** Half the side of the square that random spawn points and directions are drawn from. */
const RANDOM_SPREAD = 100;

/** One item of a non-empty list, chosen by `rng`. */
const pick = <T>(rng: Rng, items: readonly T[]): T =>
  // Safe: nextInt stays within the list (and throws for an empty one).
  items[rng.nextInt(0, items.length - 1)] as T;

/**
 * A plausible random command for seeded property-style tests (architecture 15 §9): mostly aimed
 * at live entities, sometimes at missing ones so rejections are exercised too. The same `rng`
 * state and snapshot always give the same command. `spawnKinds` must not be empty.
 */
export const randomCommand = (
  rng: Rng,
  snapshot: Snapshot,
  spawnKinds: readonly string[],
): Command => {
  const live = snapshot.entities;
  const pickedLive = live.length > 0 && rng.nextFloat() < LIVE_TARGET_SHARE;
  const entityId = pickedLive
    ? pick(rng, live).id
    : `entity-missing-${String(rng.nextInt(1, MISSING_ID_RANGE))}`;
  const point = (): { x: number; y: number } => ({
    x: (rng.nextFloat() * 2 - 1) * RANDOM_SPREAD,
    y: (rng.nextFloat() * 2 - 1) * RANDOM_SPREAD,
  });
  const builders: readonly (() => Command)[] = [
    () => ({ type: 'move', actorId: entityId, direction: point() }),
    () => ({ type: 'stop', actorId: entityId }),
    () => ({ type: 'dev-remove-entity', entityId }),
    () => ({
      type: 'dev-spawn',
      kind: pick(rng, spawnKinds),
      definitionId: 'training-dummy',
      team: rng.nextFloat() < 0.5 ? 'light' : 'dark',
      at: point(),
      count: rng.nextInt(1, 3),
    }),
  ];
  return pick(rng, builders)();
};
