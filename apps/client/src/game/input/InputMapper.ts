import type { InputIntent } from '@eternalus/core';

import type { Binding, InputAction } from '../../bridge/Binding.types';
import type { InputSnapshot } from '../engine/input/InputDevice.types';
import type { Projection } from '../engine/input/Projection.types';
import { BindingResolver } from './BindingResolver';
import { CAST_SLOTS, MODIFIER_FLAGS } from './InputMapper.constants';
import type { ActionState, KeyPress } from './InputMapper.types';

/**
 * Turns raw device state into actions through the bindings, then actions into core's
 * `InputIntent` (architecture 13 §6.2). The only reader of bindings at play time, so rebinding
 * changes what the game does with no code change. Keeps the last frame's held actions to report
 * edges.
 */
export class InputMapper {
  private readonly resolver: BindingResolver;
  private previous: ReadonlySet<InputAction> = new Set();

  /** Creates a mapper over `bindings` (defaults merged with the player's saved ones). */
  public constructor(bindings: readonly Binding[], resolver = new BindingResolver()) {
    this.resolver = resolver;
    resolver.setBindings(bindings);
  }

  /** Swaps in new bindings; called whenever the settings change. */
  public setBindings(bindings: readonly Binding[]): void {
    this.resolver.setBindings(bindings);
  }

  /** Whether a key code is bound to any action (devices prevent the browser default only then). */
  public isBound(code: string): boolean {
    return this.resolver.actionsFor({ device: 'keyboard', code }).length > 0;
  }

  /**
   * Whether one key press is a chord of `action`, its held modifiers included: a modifier chord
   * (DEC-105's Cmd/Ctrl+Shift+F3) matches only with exactly its modifiers held.
   */
  public isActionKey(action: InputAction, key: KeyPress): boolean {
    const modifiers = MODIFIER_FLAGS.filter(([, flag]) => key[flag]).map(([modifier]) => modifier);
    const chord = { device: 'keyboard', code: key.code, modifiers } as const;
    return this.resolver.actionsFor(chord).includes(action);
  }

  /** The actions `snapshot` activates: any chord of any device activates its actions. */
  public resolve(snapshot: InputSnapshot): ActionState {
    const held = new Set<InputAction>();
    for (const code of snapshot.keys) {
      this.resolver.actionsFor({ device: 'keyboard', code }).forEach((action) => held.add(action));
    }
    for (const button of snapshot.mouseButtons) {
      const chord = { device: 'mouse', code: String(button) } as const;
      this.resolver.actionsFor(chord).forEach((action) => held.add(action));
    }
    const previous = this.previous;
    this.previous = held;
    return {
      held,
      pressed: new Set([...held].filter((action) => !previous.has(action))),
      released: new Set([...previous].filter((action) => !held.has(action))),
      pointer: snapshot.pointer,
    };
  }

  /**
   * The intent for this frame: one normalised move vector (screen axes, y down), the world
   * point under the pointer and the ability and gadget slots pressed this frame.
   */
  public toIntent(actions: ActionState, projection: Projection): InputIntent {
    const { held, pressed, pointer } = actions;
    const axis = (minus: InputAction, plus: InputAction): number =>
      Number(held.has(plus)) - Number(held.has(minus));
    const x = axis('move-left', 'move-right');
    const y = axis('move-up', 'move-down');
    const scale = x !== 0 && y !== 0 ? Math.SQRT1_2 : 1;
    return {
      move: { x: x * scale, y: y * scale },
      aim: pointer === null ? null : projection.screenToWorld(pointer),
      triggered: CAST_SLOTS.filter((slot) => pressed.has(slot)),
    };
  }
}
