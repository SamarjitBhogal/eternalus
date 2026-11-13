/**
 * Types of the developer menu (13 §4) on the bridge: the commands the UI may ask for and the
 * state the game publishes to it. Types only; the UI holds no reference to core's `GameState`.
 */
import type { Command } from '@eternalus/core';

/** The gameplay commands the menu sends so far; `Match` forwards one to `Simulation.enqueueCommand`. */
export type DevCommand = Extract<
  Command,
  { readonly type: 'dev-spawn-mobs' | 'dev-spawn-legend' | 'dev-remove-entity' }
>;

/** One entry of a picker: the id the command carries and the text the menu shows. */
export type DeveloperMenuOption = { readonly id: string; readonly label: string };

/** What the menu shows, published by `Match` (`developer-menu`). */
export type DeveloperMenuState = {
  /** Whether the `toggle-developer-menu` key has opened it; never `true` while the menu is disabled. */
  readonly isOpen: boolean;
  /** The mob definitions a horde can be spawned from. */
  readonly mobs: readonly DeveloperMenuOption[];
  /** The map structures a horde can start at (the structures that sit on a lane). */
  readonly origins: readonly DeveloperMenuOption[];
};
