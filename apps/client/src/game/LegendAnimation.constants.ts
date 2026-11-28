/** Presentation timing in seconds; six separate poses are held long enough to read. */
// TUNE: provisional presentation timing; no reference doc sets it
export const LEGEND_ANIMATION = {
  frames: 6,
  idleSeconds: 1.2,
  walkSeconds: 0.84,
  attackSeconds: 0.72,
} as const;

/**
 * Sprite row indices from the shared atlas layout. Rows 6 to 9 hold ability previews; nothing
 * plays them until the kit PRs bring the abilities (DEC-298).
 */
export const LEGEND_ATLAS_ROWS = {
  idle: 0,
  south: 1,
  north: 2,
  west: 3,
  east: 4,
  attack: 5,
} as const;
