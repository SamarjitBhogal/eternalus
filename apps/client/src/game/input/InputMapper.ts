import type { AbilitySlot, InputIntent } from '@eternalus/core';

import type { Binding, InputAction, InputChord } from '../../bridge/Binding.types';
import type { InputSnapshot } from '../engine/input/InputDevice.types';
import type { Projection } from '../engine/input/Projection.types';
import { MOUSE_BUTTON_BITS, MOVE_AXES, SLOT_ACTIONS } from './InputMapper.constants';
import type { ActionState } from './InputMapper.types';

/**
 * Turns device state into player actions and actions into an `InputIntent` (architecture 13
 * §6.2). Bindings are data, so rebinding is a `setBindings` call and no key name lives here.
 * Keyboard and mouse chords match; gamepad chords wait for `GamepadDevice` (post-MVP).
 */
export class InputMapper {
  private actionsByChord = new Map<string, InputAction[]>();

  private lastHeld: ReadonlySet<InputAction> = new Set();

  /** Creates a mapper with the given bindings (defaults merged with the player's saved ones). */
  public constructor(bindings: readonly Binding[]) {
    this.setBindings(bindings);
  }

  /** Replaces the bindings; called on every settings save. */
  public setBindings(bindings: readonly Binding[]): void {
    this.actionsByChord = new Map();
    for (const { action, chords } of bindings) {
      for (const chord of chords) {
        const key = InputMapper.chordKey(chord);
        this.actionsByChord.set(key, [...(this.actionsByChord.get(key) ?? []), action]);
      }
    }
  }

  /** Whether a key code is bound to any action. */
  public isBound(code: string): boolean {
    return this.actionsByChord.has(InputMapper.chordKey({ device: 'keyboard', code, label: '' }));
  }

  /** The actions held now and the ones that started or ended since the previous call. */
  public resolve(snapshot: InputSnapshot): ActionState {
    const held = new Set<InputAction>();
    const add = (key: string): void => {
      this.actionsByChord.get(key)?.forEach((action) => held.add(action));
    };
    snapshot.keys.forEach((code) => {
      add(InputMapper.chordKey({ device: 'keyboard', code, label: '' }));
    });
    for (const [button, bit] of MOUSE_BUTTON_BITS) {
      if ((snapshot.mouseButtons & bit) !== 0) {
        add(InputMapper.chordKey({ device: 'mouse', button }));
      }
    }
    const previous = this.lastHeld;
    this.lastHeld = held;
    return {
      held,
      pressed: new Set([...held].filter((action) => !previous.has(action))),
      released: new Set([...previous].filter((action) => !held.has(action))),
      pointer: snapshot.pointer,
    };
  }

  /**
   * The intent: one normalised move vector, the world point under the pointer and the ability
   * slots pressed this frame.
   */
  public toIntent(actions: ActionState, projection: Projection): InputIntent {
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
      aim: actions.pointer === null ? null : projection.screenToWorld(actions.pointer),
      triggered,
    };
  }

  /** The index key of a chord, e.g. `keyboard:KeyW` or `mouse:3` (architecture 13 §6.2). */
  private static chordKey(chord: InputChord): string {
    switch (chord.device) {
      case 'keyboard':
        return `keyboard:${chord.code}`;
      case 'mouse':
      case 'gamepad':
        return `${chord.device}:${String(chord.button)}`;
      case 'gamepad-axis':
        return `gamepad-axis:${String(chord.axis)}:${String(chord.sign)}`;
    }
  }
}
