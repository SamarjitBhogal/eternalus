import type { MapObject } from '@eternalus/core';
import type { WorldRect } from '../engine/render/Renderer.types';
import type { ObjectRuinsView } from './ObjectRuinsView';

/** Cached object geometry avoids scanning polygon vertices on every animation frame. */
export type ObjectDrawGeometry = {
  readonly object: MapObject;
  readonly bounds: WorldRect;
  readonly ruins: ObjectRuinsView;
  /** One ruin per footprint polygon, drawn while the body is ruined (still blocking). */
  readonly pieces: readonly ObjectRuinsView[];
  /** A box holding every piece ruin: the view-cull box of a ruined body. */
  readonly pieceBounds: WorldRect;
};
