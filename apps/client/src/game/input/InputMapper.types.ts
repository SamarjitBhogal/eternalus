import type { InputAction } from '../../bridge/Binding.types';
import type { ScreenPoint } from '../engine/input/InputDevice.types';

/**
 * The actions active this frame. `pressed` and `released` are the edges since the last frame;
 * `pointer` is carried through so `toIntent` can project it into the world.
 */
export type ActionState = {
  readonly held: ReadonlySet<InputAction>;
  readonly pressed: ReadonlySet<InputAction>;
  readonly released: ReadonlySet<InputAction>;
  readonly pointer: ScreenPoint | null;
};
