import type { MapObject } from '@eternalus/core';
import type { WorldRect } from '../engine/render/Renderer.types';
import type { ObjectRuinsView } from './ObjectRuinsView';

/** What the view culls by and draws for a fallen body: one ruin, or a group of ruins. */
export type RuinLook = Pick<ObjectRuinsView, 'bounds' | 'draw'>;

/** Cached object geometry avoids scanning polygon vertices on every animation frame. */
export type ObjectDrawGeometry = {
  readonly object: MapObject;
  readonly bounds: WorldRect;
  /** A destroyed body: one ruin over its whole box. */
  readonly ruins: RuinLook;
  /** A ruined body (it still blocks): one ruin per footprint polygon. */
  readonly pieces: RuinLook;
};
