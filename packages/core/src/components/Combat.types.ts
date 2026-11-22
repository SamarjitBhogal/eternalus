import type { Vec2 } from '../utils/geometry.types';

/** One melee sweep, as `Combat.recordSwing` keeps it for the swing visual (DEC-304). */
export type CombatSwing = {
  /** The tick the swing was made. */
  readonly atTick: number;
  /** The unit vector the wedge points along. */
  readonly direction: Vec2;
  /** How far the wedge reaches from the attacker's centre, metres. */
  readonly radius: number;
  /** The wedge's angle in degrees. */
  readonly arcDegrees: number;
};
