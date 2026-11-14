import type { AbilityDisplayStep, Vec2 } from '@eternalus/core';

import type { Renderer } from '../engine/render/Renderer';

/** The area of one effect step, as the display data gives it (`AbilityDisplayStep['shape']`). */
type AimShape = AbilityDisplayStep['shape'];

/** Each shape kind's own shape type, by kind: the painters and their lookup index it. */
export type AimShapeOf = {
  readonly [K in AimShape['kind']]: Extract<AimShape, { readonly kind: K }>;
};

/**
 * One effect step of the selected ability, as the overlay draws it: its area and, for a dash, how
 * far the dash really goes (a wall or the map's edge stops it); `null` for a step that is no dash.
 */
export type AimStep = {
  readonly shape: AimShape;
  readonly reach: number | null;
};

/**
 * What the range overlay draws this frame (`AimTargeting` builds it): where the caster is drawn,
 * the unit direction toward the pointer (the zero vector while the pointer is on the caster) and
 * the selected ability's steps in cast order.
 */
export type AimTarget = {
  readonly origin: Vec2;
  readonly direction: Vec2;
  readonly steps: readonly AimStep[];
};

/**
 * Where an area is drawn for this aim: the caster, the unit direction toward the pointer (the zero
 * vector while the pointer is on the caster), the centre a circle takes (the caster, or the end of
 * a dash that came before it) and the length of a path (a dash's distance), `null` before any dash.
 */
export type AimFrame = {
  readonly origin: Vec2;
  readonly direction: Vec2;
  readonly circleCentre: Vec2;
  readonly pathLength: number | null;
};

/**
 * One painter per `EffectShape` kind. A new shape kind in core makes this type fail to compile
 * until its painter is added: the one place a cone (and its second, lighter circle) joins.
 */
export type ShapePainters = {
  readonly [K in keyof AimShapeOf]: (
    shape: AimShapeOf[K],
    frame: AimFrame,
    renderer: Renderer,
  ) => void;
};
