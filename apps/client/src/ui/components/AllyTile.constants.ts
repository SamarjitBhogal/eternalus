import type { RenditionKey } from '../../bridge/catalogue.types';
import type { AllyRosterLayout, AllyTileLook } from './AllyRoster.types';

/** The file each look draws (I-45): the 60 × 60 tile box, or the player's 60 × 60 / 70 × 70 box. */
export const ALLY_TILE_RENDITIONS: Readonly<Record<AllyTileLook, RenditionKey>> = {
  player: 'player-tile',
  'player-picked': 'player-tile-picked',
  legend: 'ally-tile',
  idle: 'ally-tile',
};

/** The player's look per step: the class step's tile, or the Legend step's enlarged tile. */
export const PLAYER_TILE_LOOKS: Readonly<Record<AllyRosterLayout, AllyTileLook>> = {
  'class-step': 'player',
  'legend-step': 'player-picked',
};
