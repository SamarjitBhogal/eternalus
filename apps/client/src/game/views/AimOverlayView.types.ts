import type { AbilityDisplayStep, Vec2 } from '@eternalus/core';

import type { Renderer } from '../engine/render/Renderer';

/** The area of one effect step, as the display data gives it (`AbilityDisplayStep['shape']`). */
type AimShape = AbilityDisplayStep['shape'];

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

/** Draws one kind of area through the renderer. */
type ShapePainter<S extends AimShape> = (shape: S, frame: AimFrame, renderer: Renderer) => void;

/**
 * One painter per `EffectShape` kind. A new shape kind in core makes this type fail to compile
 * until its painter is added: the one place a cone (and its second, lighter circle) joins.
 */
export type ShapePainters = {
  readonly [K in AimShape['kind']]: ShapePainter<Extract<AimShape, { kind: K }>>;
};

/**
 * How far a dash of up to `distance` metres from `origin` along the unit `direction` may go before
 * a wall stops it: the simulation's own answer (`Simulation.dashReach`), so the overlay never draws
 * a dash the game will not give.
 */
export type DashReach = (origin: Vec2, direction: Vec2, distance: number) => number;
