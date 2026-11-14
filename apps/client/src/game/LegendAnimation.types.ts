import type { WorldPoint } from './engine/render/Renderer.types';

/** One successful cast/shot or the most recently observed walking direction. */
export type LegendPose = {
  readonly row: number;
  readonly startedTick: number;
  readonly duration: number;
};

/** A cast anchored to its original ground position, independent of subsequent walking. */
export type LegendCastPose = LegendPose & {
  readonly origin: WorldPoint;
  readonly direction: WorldPoint;
};

/** Tick-derived visual state, never a damaging zone or a simulation entity. */
export type LegendCastFrame = {
  readonly atlasId: string;
  readonly row: number;
  readonly progress: number;
  readonly fade: number;
  readonly origin: WorldPoint;
  readonly direction: WorldPoint;
};
