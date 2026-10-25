/**
 * The HUD minimap ring (Figma 62:231, 65:743 Compass Ring), one value for both readers (06 §10):
 * `ui/hud/MinimapPanel` draws the ring in CSS (its test asserts the same box) and `game/Match`
 * passes it to `MiniMapView`, which draws the map inside it. Design pixels of the 1920 × 1080 frame.
 */

/** The frame the ring is designed in (Figma 62:231). */
export const MINI_MAP_DESIGN_FRAME = { width: 1920, height: 1080 } as const;

/** The ring's ellipse box from the frame's top-right corner (65:743: 255 × 244 at 1636, 47). */
export const MINI_MAP_RING = { right: 29, top: 47, width: 255, height: 244 } as const;

/** The ring's 4 px inside stroke; the map is drawn inside it. */
export const MINI_MAP_RING_STROKE = 4;
