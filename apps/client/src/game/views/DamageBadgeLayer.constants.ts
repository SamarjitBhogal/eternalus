import type { WorldPoint } from '../engine/render/Renderer.types';
import type { DamageBadgeKind, DamageBadgeStyle } from './DamageBadgeLayer.types';

/** One full turn in radians. */
const FULL_TURN = 2 * Math.PI;

/** How many points trace a curved badge outline. */
const CURVE_POINTS = 24;

/** A badge that does not move as it fades. */
const STILL: WorldPoint = { x: 0, y: 0 };

/**
 * How long a badge shows at full strength after it appears, then how long it takes to fade
 * (W5b: "stays about 1 s, then fades"). A badge is gone after both.
 */
// TUNE: W5b (DEC-410)
export const BADGE_HOLD_SECONDS = 1;
// TUNE: W5b (DEC-410)
export const BADGE_FADE_SECONDS = 0.35;
export const BADGE_LIFETIME_SECONDS = BADGE_HOLD_SECONDS + BADGE_FADE_SECONDS;

/** The pop (W5b): a badge appears this much larger and shrinks to its size over the pop time. */
// TUNE: W5b (DEC-410)
export const BADGE_POP_SCALE = 1.5;
// TUNE: W5b (DEC-410)
export const BADGE_POP_SECONDS = 0.15;

/** A badge's radius in world units (a Legend is `LEGEND_VISUAL_DIAMETER` = 5.2 wide). */
// TUNE: W5a (DEC-410)
export const BADGE_RADIUS = 1.2;

/** How much larger a big hit's badge is (W5a). */
// TUNE: W5a (DEC-410)
export const BIG_BADGE_SCALE = 1.35;

/** How far above the target's position the badges sit, in world units: on the body. */
// TUNE: W5a (DEC-410)
export const BADGE_LIFT = 2.6;

/** Distance between the centres of two side-by-side badges, in world units. */
// TUNE: W5b (DEC-410)
export const BADGE_SPACING = 2.7;

/**
 * Where each of a target's side-by-side places sits, in `BADGE_SPACING` steps from its centre:
 * one entry per place, so its length is W5b's stack limit ("up to 4 side by side"). The first
 * badge sits in the middle; the next ones go left, right, then right again.
 */
// TUNE: W5b (DEC-410)
export const BADGE_SLOT_OFFSETS: readonly number[] = [0, -1, 1, 2];

/** The number: Cinzel (DEC-67), white on every badge (W5a), its height in badge radii. */
export const BADGE_FONT = 'Cinzel, serif';
export const BADGE_FONT_WEIGHT = 700;
// TUNE: W5a (DEC-410)
export const BADGE_TEXT_SCALE = 0.8;
export const BADGE_TEXT_RGB = '255,255,255';

/**
 * The dark edge of a badge and of its number, as `r,g,b`: the badge's edge width is in screen
 * pixels (`Renderer.strokePath`), the number's outline in CSS pixels (`Renderer.drawText`).
 */
export const BADGE_EDGE_RGB = '27,27,27';
// TUNE: W5a (DEC-410)
export const BADGE_EDGE_WIDTH = 1.5;
// TUNE: W5a (DEC-410)
export const BADGE_TEXT_OUTLINE_WIDTH = 2;

/** A big hit's gold rim (W5a), as `r,g,b`, and its width in screen pixels. */
export const BADGE_GOLD_RGB = '212,175,55';
// TUNE: W5a (DEC-410)
export const BADGE_GOLD_WIDTH = 3;

/** A bleed drop slides down this far as it fades, in badge radii (W5b "drip"). */
// TUNE: W5b (DEC-410)
const DRIP_DISTANCE = 0.8;

/** A flame rises this far as it fades, in badge radii, and sways at this rate (W5b "flicker"). */
// TUNE: W5b (DEC-410)
const FLAME_RISE = 0.8;
// TUNE: W5b (DEC-410); at most 3 Hz (05-engineering-standards: nothing flashes faster)
const FLAME_SWAY_HZ = 2.5;
// TUNE: W5b (DEC-410)
const FLAME_SWAY = 0.15;

/** Points on a circle of radius 1. */
const circle = (): readonly WorldPoint[] =>
  Array.from({ length: CURVE_POINTS }, (_, index) => {
    const angle = (index / CURVE_POINTS) * FULL_TURN;
    return { x: Math.cos(angle), y: Math.sin(angle) };
  });

/** A drop with its tip at the top and its round end at the bottom (widest at `y` 0.5). */
const drop = (): readonly WorldPoint[] =>
  Array.from({ length: CURVE_POINTS }, (_, index) => {
    const turn = (index / CURVE_POINTS) * FULL_TURN;
    return { x: 1.05 * Math.sin(turn) * Math.sin(turn / 2), y: -Math.cos(turn) };
  });

/** A Roman scutum: a tall shield whose top and bottom edges bow out. */
const SCUTUM: readonly WorldPoint[] = [
  { x: -0.82, y: -0.9 },
  { x: -0.42, y: -1 },
  { x: 0, y: -1.03 },
  { x: 0.42, y: -1 },
  { x: 0.82, y: -0.9 },
  { x: 0.82, y: 0.9 },
  { x: 0.42, y: 1 },
  { x: 0, y: 1.03 },
  { x: -0.42, y: 1 },
  { x: -0.82, y: 0.9 },
];

/** A flame with three tongues over a round base. */
const FLAME: readonly WorldPoint[] = [
  { x: 0, y: -1.05 },
  { x: 0.28, y: -0.45 },
  { x: 0.55, y: -0.78 },
  { x: 0.62, y: -0.15 },
  { x: 0.85, y: 0.15 },
  { x: 0.75, y: 0.62 },
  { x: 0.4, y: 0.95 },
  { x: -0.4, y: 0.95 },
  { x: -0.75, y: 0.62 },
  { x: -0.85, y: 0.15 },
  { x: -0.62, y: -0.15 },
  { x: -0.55, y: -0.78 },
  { x: -0.28, y: -0.45 },
];

/**
 * How each kind of badge looks and moves (W5a, W5b; DEC-410). A new kind is one entry here.
 * Each shape differs, so colour is never the only signal (NFR-030).
 */
// TUNE: W5a colours and shapes (DEC-410)
export const DAMAGE_BADGE_STYLES: Readonly<Record<DamageBadgeKind, DamageBadgeStyle>> = {
  hit: { outline: SCUTUM, rgb: '178,24,30', textOffsetY: 0, motion: () => STILL },
  bleed: {
    outline: drop(),
    rgb: '110,6,12',
    textOffsetY: 0.35,
    motion: (fade) => ({ x: 0, y: DRIP_DISTANCE * fade }),
  },
  burn: {
    outline: FLAME,
    rgb: '232,112,24',
    textOffsetY: 0.3,
    motion: (fade, seconds) => ({
      x: Math.sin(seconds * FLAME_SWAY_HZ * FULL_TURN) * FLAME_SWAY * fade,
      y: -FLAME_RISE * fade,
    }),
  },
  steel: { outline: circle(), rgb: '128,134,142', textOffsetY: 0, motion: () => STILL },
};
