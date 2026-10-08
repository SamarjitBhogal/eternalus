import type { AbilitySlot, InputIntent } from '@eternalus/core';

import type { Binding, InputAction } from '../../bridge/Binding.types';
import type { InputSnapshot } from '../engine/input/InputDevice.types';
import { MOVE_AXES, SLOT_ACTIONS } from './InputMapper.constants';
import type { ActionState } from './InputMapper.types';

/**
 * Turns device state into player actions and actions into an `InputIntent` (architecture 13
 * §6.2). Bindings are data, so rebinding is a `setBindings` call and no key name lives here.
 * Only keyboard chords match until the mouse and gamepad devices exist.
 */
export class InputMapper {
  private actionsByCode = new Map<string, InputAction[]>();

  private lastHeld: ReadonlySet<InputAction> = new Set();

  /** Creates a mapper with the given bindings (defaults merged with the player's saved ones). */
  public constructor(bindings: readonly Binding[]) {
    this.setBindings(bindings);
  }

  /** Replaces the bindings; called on every settings save. */
  public setBindings(bindings: readonly Binding[]): void {
    this.actionsByCode = new Map();
    for (const { action, chords } of bindings) {
      for (const chord of chords) {
        if (chord.device === 'keyboard') {
          this.actionsByCode.set(chord.code, [
            ...(this.actionsByCode.get(chord.code) ?? []),
            action,
          ]);
        }
      }
    }
  }

  /** Whether a key code is bound to any action. */
  public isBound(code: string): boolean {
    return this.actionsByCode.has(code);
  }

  /** The actions held now and the ones that started or ended since the previous call. */
  public resolve(snapshot: InputSnapshot): ActionState {
    const held = new Set<InputAction>();
    for (const code of snapshot.keys) {
      this.actionsByCode.get(code)?.forEach((action) => held.add(action));
    }
    const previous = this.lastHeld;
    this.lastHeld = held;
    return {
      held,
      pressed: new Set([...held].filter((action) => !previous.has(action))),
      released: new Set([...previous].filter((action) => !held.has(action))),
    };
  }

  /** The intent: one normalised move vector and the ability slots pressed this frame. */
  public toIntent(actions: ActionState): InputIntent {
    let x = 0;
    let y = 0;
    for (const [action, dx, dy] of MOVE_AXES) {
      if (actions.held.has(action)) {
        x += dx;
        y += dy;
      }
    }
    const length = Math.hypot(x, y);
    const triggered: AbilitySlot[] = SLOT_ACTIONS.filter((slot) => actions.pressed.has(slot));
    return {
      // Opposite keys cancel out, which leaves a zero vector that must not be divided.
      move: length === 0 ? { x: 0, y: 0 } : { x: x / length, y: y / length },
      aim: null,
      triggered,
    };
  }
}
