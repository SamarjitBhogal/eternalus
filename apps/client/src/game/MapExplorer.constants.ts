/** Settings for the free map view, independent of gameplay controls. */
export const EXPLORER_SETTINGS = {
  /** TUNE: deep enough to reach the following camera's close-up view of the battlefield. */
  maxZoom: 32,
  interiorZoom: 1.65,
  /** How much a minimap click zooms in while the free view is on screen. */
  minimapZoom: 2,
  wheelSensitivity: 0.0015,
} as const;
