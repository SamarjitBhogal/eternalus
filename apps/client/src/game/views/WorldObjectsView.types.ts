import type { MapObject } from '@eternalus/core';
import type { WorldRect } from '../engine/render/Renderer.types';

/** Cached object geometry avoids scanning polygon vertices on every animation frame. */
export type ObjectDrawGeometry = { readonly object: MapObject; readonly bounds: WorldRect };
