import type { WorldRect } from '../engine/render/Renderer.types';

/** Cached presentation bounds extracted from explicitly tagged scenery polygons. */
export type AtmosphericRegion = { readonly kind: 'snow' | 'lava'; readonly bounds: WorldRect };
