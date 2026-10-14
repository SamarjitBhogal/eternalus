/** Presentation-only surface courses, independent of camera or gameplay tuning. */
export type SurfaceMaterial = {
  readonly tokens: readonly string[];
  readonly step: number;
  readonly height: number;
  readonly hasSeams: boolean;
  readonly isSparse: boolean;
  readonly isWater: boolean;
};

/** Cached visible material geometry grouped by paint colour. */
export type SurfaceBatch = Map<string, (readonly { readonly x: number; readonly y: number }[])[]>;
