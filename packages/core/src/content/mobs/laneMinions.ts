import { HEAVY_MINION } from './heavyMinion';
import { LIGHT_MINION } from './lightMinion';
import { MEDIUM_MINION } from './mediumMinion';

/**
 * The three lane minions (architecture 18 §3), light to heavy, by id and display name: the mobs
 * the developer menu spawns as a horde (13 §4). The names are the definitions' own.
 */
export const LANE_MINIONS: readonly { readonly id: string; readonly displayName: string }[] = [
  LIGHT_MINION,
  MEDIUM_MINION,
  HEAVY_MINION,
].map(({ id, displayName }) => ({ id, displayName }));
