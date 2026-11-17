import type { InputIntent } from '@eternalus/core';

/** A point on the map. */
export type BotPoint = { readonly x: number; readonly y: number };

/** Where a walker at `start` should head next to reach `goal`; core's `AStarPathfinder` fits. */
export type WaypointSource = {
  waypoint(start: BotPoint, goal: BotPoint, out: { x: number; y: number }): boolean;
};

/** The bot's own Legend: where it stands and how big it is. */
export type BotBody = BotPoint & { readonly radius: number };

/** What a bot sends for one state. */
export type BotIntent = InputIntent;
