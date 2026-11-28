/**
 * Types of the developer menu (13 §4) on the bridge: the commands the UI may ask for and the
 * state the game publishes to it. Types only; the UI holds no reference to core's `GameState`.
 */
import type { Command } from '@eternalus/core';

/**
 * The developer commands (every `Command` whose type starts with `dev-`), and no player command;
 * `Match` forwards one to `Simulation.enqueueCommand`. A new `dev-` command needs no edit here.
 */
export type DevCommand = Extract<Command, { readonly type: `dev-${string}` }>;

/** One entry of a picker: the id the command carries and the text the menu shows. */
export type DeveloperMenuOption = { readonly id: string; readonly label: string };

/**
 * What the menu shows, published by `Match` (`developer-menu`). The mob picker reads the lane
 * minions from the display catalogue (`contentSlice`), not from here.
 */
export type DeveloperMenuState = {
  /** Whether the `toggle-developer-menu` key has opened it; never `true` while the menu is disabled. */
  readonly isOpen: boolean;
  /** The map structures a horde can start at (the structures that sit on a lane). */
  readonly origins: readonly DeveloperMenuOption[];
  /** The human's Legend, or `null` in sim mode (no human); sim mode's buttons read it. */
  readonly humanLegendId: string | null;
  /**
   * The Legend the camera follows while no human is seated (sim mode's Follow, client-only), or
   * `null` when it follows none.
   */
  readonly followedLegendId: string | null;
  /** The Legends in the match, for sim mode's Follow picker. */
  readonly legends: readonly DeveloperMenuOption[];
  /**
   * The controller ids sim mode's controls send (core's): the human's (`player`), and the bots' a
   * developer can pick, the Rover's and the lane bot's.
   */
  readonly controllerIds: {
    readonly player: string;
    readonly rover: string;
    readonly laner: string;
  };
};
