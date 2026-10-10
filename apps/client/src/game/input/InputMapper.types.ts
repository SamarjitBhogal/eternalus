import type { InputAction } from '../../bridge/Binding.types';
import type { ScreenPoint } from '../engine/input/InputDevice.types';

/** Which actions are active this frame, and which started or ended since the last one. */
export type ActionState = {
  readonly held: ReadonlySet<InputAction>;
  readonly pressed: ReadonlySet<InputAction>;
  readonly released: ReadonlySet<InputAction>;
  /** Where the pointer is on the canvas, or `null` when it is off the canvas. */
  readonly pointer: ScreenPoint | null;
};
