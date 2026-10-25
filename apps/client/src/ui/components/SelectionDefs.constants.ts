import type { GlowFilterDef, GlowShadow, TextGlowDef } from './SelectionDefs.types';

/**
 * Ids of the shared SVG defs, referenced from module CSS as `url(#…)`. None starts with three hex
 * letters, so the colour-literal grep (`#[0-9a-f]{3,8}`) cannot match a reference.
 */
export const SELECTION_DEF_IDS = {
  /** Every card arch (cards, refraction copies, glass panes, Legends-row minis). */
  archClip: 'sel-arch-clip',
  /** Select Class and LOCK IN rings (62:223, 58:273: the same six shadows). */
  glowRing: 'sel-glow-ring',
  /** One brace of either button (62:226/62:227, 58:275/58:322). */
  glowBrace: 'sel-glow-brace',
  /** The braces group of either button (62:225, 58:278): its glows only, cast from the strokes. */
  glowBraces: 'sel-glow-braces',
  /** The glow group of either button (62:222, 58:277): its shadow only, knocked out. */
  glowGroup: 'sel-glow-group',
  /** The glow group while hovered (CD-11 fill-in; the Figma draws no hover). */
  glowGroupHover: 'sel-glow-group-hover',
  /** The glow group while pressed (CD-11 fill-in; the Figma draws no press). */
  glowGroupPress: 'sel-glow-group-press',
  /** The picked Legend art and its refraction copy (55:255, 61:8). */
  glowSelected: 'sel-glow-selected',
  /** The picked Legend inner frame and its refraction copy (55:256, 61:6). */
  glowInner: 'sel-glow-inner',
  /** Select Class and LOCK IN labels (62:228, 58:276: the same six sky shadows). */
  glowLabel: 'sel-glow-label',
  /** The character-select countdown (62:135, 58:281). */
  glowCountdown: 'sel-glow-countdown',
  /** GLASS light rim, −45° at intensity 0.8 (the CSS glass approximation, CD-15). */
  glassRim: 'sel-glass-rim',
} as const;

/** Figma radius 20 → σ 10, radius 10 → σ 5, radius 5 → σ 2.5 (CD-15). */
const shadow = (dy: number, sigma: number, flood: GlowShadow['flood']): GlowShadow => ({
  dx: 0,
  dy,
  sigma,
  flood,
});

/** The glow group boxes (`.lit`, the button root's box) of Select Class and LOCK IN. */
const GLOW_GROUP_USERS: GlowFilterDef['users'] = [
  { node: '62:222 Select Class glow group', width: 344, height: 62.249, bleed: 75 },
  { node: '58:277 LOCK IN glow group', width: 314, height: 55.25, bleed: 75 },
];

/**
 * Each multi-shadow glow with its region and its users. A user's box is its Figma layer box; its
 * bleed is how far its own paint reaches past the box before the filter (half a centre stroke, or
 * the glow of a filtered child). Every region is sized for its smallest user, so a large card's
 * fraction never clips a small brace.
 */
export const GLOW_FILTERS: readonly GlowFilterDef[] = [
  {
    id: SELECTION_DEF_IDS.glowRing,
    region: { x: -0.15, y: -0.9, width: 1.3, height: 2.8 },
    // 62:223 / 58:273: frost 0 4, frost 55 % 0 −4, then frost 0 ±4 four times, all radius 20.
    shadows: [
      shadow(4, 10, 'frost'),
      shadow(-4, 10, 'frost-soft'),
      shadow(4, 10, 'frost'),
      shadow(-4, 10, 'frost'),
      shadow(4, 10, 'frost'),
      shadow(-4, 10, 'frost'),
    ],
    // showShadowBehindNode false: Figma hides 58:273's glows inside the ring's whole box, not
    // only under its stroke (the 58:271 plate has no glow just inside the ring): cut out there.
    knockout: 'geometry',
    source: 'merged',
    users: [
      { node: '62:223 Select Class ring', width: 338.956, height: 62.249, bleed: 0 },
      { node: '58:273 LOCK IN ring', width: 309.4, height: 55.25, bleed: 0 },
    ],
  },
  {
    id: SELECTION_DEF_IDS.glowBrace,
    region: { x: -2.5, y: -1, width: 6, height: 3 },
    // Parchment 0 −4 radius 20, parchment 0 4 radius 10.
    shadows: [shadow(-4, 10, 'parchment'), shadow(4, 5, 'parchment')],
    knockout: 'none',
    source: 'merged',
    users: [
      { node: '62:227 Select Class brace', width: 17.654, height: 48.762, bleed: 0.5 },
      { node: '58:322 LOCK IN brace', width: 16.114, height: 43.279, bleed: 0.5 },
    ],
  },
  {
    id: SELECTION_DEF_IDS.glowBraces,
    region: { x: -0.25, y: -1.75, width: 1.5, height: 4.5 },
    // Azure radius 20 at 0 −2, 0 2, 0 −2, 0 2, cast from the two 1 px brace strokes only (a plain
    // copy without their parchment glows, which would cast it from the broad glow alpha, as the
    // visual audit of 62:125 showed); the braces with their glows are drawn above, unfiltered by
    // this def.
    shadows: [
      shadow(-2, 10, 'azure'),
      shadow(2, 10, 'azure'),
      shadow(-2, 10, 'azure'),
      shadow(2, 10, 'azure'),
    ],
    knockout: 'none',
    source: 'omitted',
    users: [
      { node: '62:225 Select Class brace strokes', width: 344, height: 48.762, bleed: 0.5 },
      { node: '58:278 LOCK IN brace strokes', width: 314, height: 43.28, bleed: 0.5 },
    ],
  },
  // The group shadows are cast from a plain copy of ring, haze and brace strokes (no ring, brace or
  // braces glows, per the visual audit of 62:125) and drawn beneath the unfiltered group; the
  // haze's blur(25px) reaches 3σ = 75 px past the group box, so the group's bleed is 75 px.
  {
    id: SELECTION_DEF_IDS.glowGroup,
    region: { x: -0.3, y: -1.75, width: 1.6, height: 4.5 },
    // 58:277: azure 80 % 0 4 radius 10, showShadowBehindNode false (62:222 has the same shadow).
    shadows: [shadow(4, 5, 'azure-strong')],
    knockout: 'alpha',
    source: 'omitted',
    users: GLOW_GROUP_USERS,
  },
  {
    id: SELECTION_DEF_IDS.glowGroupHover,
    region: { x: -0.35, y: -1.85, width: 1.7, height: 4.7 },
    // Hover lifts the group glow: azure 100 % 0 4 σ 7.
    shadows: [shadow(4, 7, 'azure')],
    knockout: 'alpha',
    source: 'omitted',
    users: GLOW_GROUP_USERS,
  },
  {
    id: SELECTION_DEF_IDS.glowGroupPress,
    region: { x: -0.3, y: -1.75, width: 1.6, height: 4.5 },
    // A press tightens it: azure 80 % 0 2 σ 3.
    shadows: [shadow(2, 3, 'azure-strong')],
    knockout: 'alpha',
    source: 'omitted',
    users: GLOW_GROUP_USERS,
  },
  {
    id: SELECTION_DEF_IDS.glowSelected,
    region: { x: -0.15, y: -0.08, width: 1.3, height: 1.16 },
    // 55:255: pale 0 4 radius 20 (shown behind the node), azure 0 −4 radius 20.
    shadows: [shadow(4, 10, 'pale'), shadow(-4, 10, 'azure')],
    knockout: 'none',
    source: 'merged',
    users: [
      { node: '55:255 picked Legend art', width: 313.71, height: 659.46, bleed: 1 },
      { node: '61:8 picked refraction art', width: 353.86, height: 697.64, bleed: 1 },
    ],
  },
  {
    id: SELECTION_DEF_IDS.glowInner,
    region: { x: -0.05, y: -0.03, width: 1.1, height: 1.06 },
    // 55:256: azure 0 0 radius 5 and azure 80 % 0 0 radius 5.
    shadows: [shadow(0, 2.5, 'azure'), shadow(0, 2.5, 'azure-strong')],
    knockout: 'none',
    source: 'merged',
    users: [
      { node: '55:256 picked Legend inner frame', width: 301.52, height: 646.37, bleed: 0.5 },
      { node: '61:6 picked refraction inner frame', width: 340.11, height: 683.79, bleed: 0.5 },
    ],
  },
];

/** A text-glow shadow: offset, σ = the Figma radius / 2 (CD-15) and the colour's alpha. */
const textShadow = (
  dx: number,
  dy: number,
  sigma: number,
  opacity = 1,
): TextGlowDef['shadows'][number] => ({ dx, dy, sigma, opacity });

/**
 * The text glows (regions as above), built as the two experiments of the visual audit of 62:125
 * and pixel-identical to them in Chrome 155 (probe over black and white). CSS
 * text-shadows, or a flood per shadow, drift the haze hue: the 62:228 haze's mean straight colour
 * was 103, 186, 250 flooded per shadow and 114, 182, 253 flooded once (the sky token is 117, 180,
 * 251); as text-shadows it was greener still. Each region is the experiment's, not the 3σ
 * minimum: Chrome's blur depends on the region (with this construction, a 4.4-box-tall region
 * moved the LOCK IN haze by up to 13 code values), and these are the measured ones.
 * The σ are measured too (OD-27, stream C's DECISION-glow-sigma.md): Figma's blur radius r renders
 * closer to σ = 0.85 × r / 2 than to the derived r / 2. Against the live frames the label's 0.85
 * scale halves the LOCK IN residual and the countdown's σ 3.4 is the best of 2.8 to 4 on 62:125,
 * 62:70 and 58:271; no region gets a worse audit status.
 */
export const TEXT_GLOW_FILTERS: readonly TextGlowDef[] = [
  {
    id: SELECTION_DEF_IDS.glowLabel,
    // A box width each side also holds a label the CD-23 floor sets wider than its box.
    region: { x: -1, y: -3, width: 3, height: 7 },
    // 62:228 / 58:276: sky 0 4 radius 25, then sky 0 −4 and 0 4 radius 50 alternating (five);
    // σ 0.85 × r / 2 (OD-27).
    shadows: [
      textShadow(0, 4, 10.625),
      textShadow(0, -4, 21.25),
      textShadow(0, 4, 21.25),
      textShadow(0, -4, 21.25),
      textShadow(0, 4, 21.25),
      textShadow(0, -4, 21.25),
    ],
    flood: 'sky',
    users: [
      { node: '62:228 Select Class label', width: 256.357, height: 55.208, bleed: 0 },
      { node: '58:276 LOCK IN label', width: 314, height: 48, bleed: 0 },
    ],
  },
  {
    id: SELECTION_DEF_IDS.glowCountdown,
    region: { x: -0.5, y: -0.5, width: 2, height: 2 },
    // 62:135 / 58:281: the countdown red at 15 % (the --selection-countdown-glow alpha) at
    // (6, 0), (−6, 0), (0, 6), (0, −6), radius 8; measured σ 3.4 (OD-27).
    shadows: [
      textShadow(6, 0, 3.4, 0.15),
      textShadow(-6, 0, 3.4, 0.15),
      textShadow(0, 6, 3.4, 0.15),
      textShadow(0, -6, 3.4, 0.15),
    ],
    flood: 'countdown',
    users: [{ node: '62:135 / 58:281 countdown', width: 118, height: 83, bleed: 0 }],
  },
];
