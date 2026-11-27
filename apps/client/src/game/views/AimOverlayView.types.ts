import type { AbilityDisplayStep, PlacedSummon, Vec2 } from '@eternalus/core';

import type { Renderer } from '../engine/render/Renderer';

/** The area of one effect step, as the display data gives it (`AbilityDisplayStep['shape']`). */
type AimShape = NonNullable<AbilityDisplayStep['shape']>;

/** Colours of one overlay area: its fill and its outline. */
export type AimAreaColors = { readonly fill: string; readonly outline: string };

/** Each shape kind's own shape type, by kind: the painters and their lookup index it. */
export type AimShapeOf = {
  readonly [K in AimShape['kind']]: Extract<AimShape, { readonly kind: K }>;
};

/**
 * One effect step of the selected ability, as the overlay draws it: its area (`null` for a step
 * with none, a dash's own row), for a dash how far the dash really goes (a wall or the map's edge
 * stops it; `null` for a step that is no dash), and the outline core placed for it (an `outline`
 * shape, with whether the cast is refused there, DEC-382, HC-B43 (7), HC-S15; `null` for every
 * other step and while the pointer is on the caster).
 */
export type AimStep = {
  readonly shape: AimShape | null;
  readonly reach: number | null;
  readonly placed: PlacedSummon | null;
};

/**
 * What the range overlay draws this frame (`AimTargeting` builds it): where the caster is drawn,
 * its body radius, the unit direction toward the pointer (the zero vector while the pointer is on
 * the caster) and the selected ability's steps in cast order.
 */
export type AimTarget = {
  readonly origin: Vec2;
  readonly casterRadius: number;
  readonly direction: Vec2;
  readonly steps: readonly AimStep[];
};

/**
 * Where an area is drawn for this aim: the caster and its body radius (a cone's reach counts from
 * the body edge, DEC-319), the unit direction toward the pointer (the zero vector while the pointer
 * is on the caster), the centre a circle takes (the caster, or the end of a dash that came before
 * it), the length of a path (a dash's distance), `null` before any dash, and the outline core
 * placed for the step drawn now (`AimStep.placed`; the outline painter draws it).
 */
export type AimFrame = {
  readonly origin: Vec2;
  readonly casterRadius: number;
  readonly direction: Vec2;
  readonly circleCentre: Vec2;
  readonly pathLength: number | null;
  readonly placed: PlacedSummon | null;
};

/**
 * One painter per `EffectShape` kind. A new shape kind in core makes this type fail to compile
 * until its painter is added (as the cone's was, with its full-turn circle).
 */
export type ShapePainters = {
  readonly [K in keyof AimShapeOf]: (
    shape: AimShapeOf[K],
    frame: AimFrame,
    renderer: Renderer,
  ) => void;
};
