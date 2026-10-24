/** The token a glow's flood takes (a class of `SelectionDefs.module.css`; never a colour literal). */
export type GlowFlood =
  'frost' | 'frost-soft' | 'parchment' | 'azure' | 'azure-strong' | 'pale' | 'sky' | 'countdown';

/** One Figma DROP_SHADOW as an SVG shadow: offset and σ = the Figma radius / 2 (CSUI E11). */
export type GlowShadow = {
  readonly dx: number;
  readonly dy: number;
  readonly sigma: number;
  readonly flood: GlowFlood;
};

/** A filter region in fractions of its user's box (`filterUnits="objectBoundingBox"`). */
type FilterRegion = {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
};

/**
 * An element a filter is applied to, with its box in px and how far its own content already
 * reaches past that box (a stroke's outer half, or a child's glow) before the filter's shadows.
 */
type FilterUser = {
  readonly node: string;
  readonly width: number;
  readonly height: number;
  readonly bleed: number;
};

/** A multi-shadow glow (Figma's shadows do not compound, so each is its own branch, SUB P8). */
export type GlowFilterDef = {
  readonly id: string;
  /** Sized for the smallest user: per side ≥ bleed + 3σ + |offset| (I-66). */
  readonly region: FilterRegion;
  /** Bottom to top, merged beneath the source graphic. */
  readonly shadows: readonly GlowShadow[];
  /**
   * Where each shadow is cut out, as Figma's `showShadowBehindNode: false` hides it: `'none'`
   * keeps it whole; `'alpha'` cuts it under the source's alpha, so no shadow shows through a
   * translucent source (the glow group's ring glows and haze); `'geometry'` cuts it under the
   * user's whole box, transparent interior included (the rings: Figma draws no glow inside the
   * 58:273 stroke, visual audit r3).
   */
  readonly knockout: 'none' | 'alpha' | 'geometry';
  /**
   * `'merged'`: the user's own paint is merged above the shadows. `'omitted'`: the filter paints
   * the shadows only; its user is a plain copy of the geometry they are cast from (strokes without
   * their own glows) and an unfiltered sibling above draws the content. Figma casts a group's
   * shadow from its children's geometry, not from their glows (WP-CLASS CSS audit of 62:125: a
   * group filter over glowing children cast its azure from the broad glow alpha).
   */
  readonly source: 'merged' | 'omitted';
  readonly users: readonly FilterUser[];
};

/**
 * A text layer's glow: Figma shadows of one colour (`region` and `users` as in `GlowFilterDef`).
 * Each shadow is its own alpha-only branch (offset, σ, then its colour's alpha); the merged
 * branches are flooded once with `flood`, so the colour is applied once, not once per shadow.
 * No knockout: the shadows lie whole beneath the text.
 */
export type TextGlowDef = {
  readonly id: string;
  /** Sized for the smallest user: per side ≥ bleed + 3σ + |offset| (I-66). */
  readonly region: FilterRegion;
  /** Bottom to top, merged beneath the source graphic. `opacity` is the Figma colour's alpha. */
  readonly shadows: readonly {
    readonly dx: number;
    readonly dy: number;
    readonly sigma: number;
    readonly opacity: number;
  }[];
  /** The shadows' colour at full opacity: the one flood over their merged alpha. */
  readonly flood: GlowFlood;
  readonly users: readonly FilterUser[];
};
