/** The Figma's number of charge boxes (62:250), drawn while the count is unknown. */
export const FIGMA_PIP_COUNT = 3;

/** One charge box (62:252/253/254) in Figma px: its edge, the step between boxes, its fill. */
export const PIP_GEOMETRY = {
  /** 23.861 px boxes with a 1 px inside stroke. */
  size: 23.8613,
  /** Tops at 946, 975.827, 1005.65: a 29.825 px pitch. */
  pitch: 29.825,
  /** The fill, 19.089 px, sits 2.386 px inside the box (62:256/257). */
  fillInset: 2.3862,
  fillSize: 19.0891,
  stroke: 1,
  /**
   * Steps per px of the grid the Figma render puts each box's top and bottom edge on
   * (`hud.figma.png`: 946–969.875, 975.875–999.625, 1005.625–1029.5, i.e. 1/8 px). The stroke is
   * drawn on those rendered edges, at most 0.063 px from the node geometry (a `normalised` CD
   * row, WP-HUD audit round 1); the fills keep the node geometry.
   */
  edgeStepsPerPx: 8,
} as const;
