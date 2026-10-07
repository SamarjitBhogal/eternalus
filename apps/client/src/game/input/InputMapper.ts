import type { Vec2 } from '@eternalus/core';

import type { Binding, InputAction } from '../../bridge/Binding.types';
import type { InputSnapshot } from '../engine/input/InputDevice.types';
import type { BindingResolver } from './BindingResolver';
import { CAST_SLOTS } from './InputMapper.constants';
import type { ActionState, InputIntent } from './InputMapper.types';

/**
 * Turns raw device state into actions through the bindings, then actions into an
 * `InputIntent`. The only reader of bindings at play time, so rebinding changes what the game
 * does with no code change. Keeps the last frame's held actions to report edges.
 */
export class InputMapper {
  private readonly resolver: BindingResolver;
  private previous: ReadonlySet<InputAction> = new Set();

  /** Creates a mapper over `bindings`, indexed by `resolver`. */
  public constructor(bindings: readonly Binding[], resolver: BindingResolver) {
    this.resolver = resolver;
    resolver.setBindings(bindings);
  }

  /** Swaps in new bindings; called on every settings save. */
  public setBindings(bindings: readonly Binding[]): void {
    this.resolver.setBindings(bindings);
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
    };
  }

  /** The intent for this frame. `aim` is the pointer already projected into the world. */
  public toIntent(actions: ActionState, aim: Vec2 | null): InputIntent {
    const { held, pressed } = actions;
    const axis = (minus: InputAction, plus: InputAction): number =>
      Number(held.has(plus)) - Number(held.has(minus));
    const x = axis('move-left', 'move-right');
    const y = axis('move-up', 'move-down');
    const scale = x !== 0 && y !== 0 ? Math.SQRT1_2 : 1;
    return {
      move: { x: x * scale, y: y * scale },
      aim,
      attack: pressed.has('attack'),
      cast: CAST_SLOTS.find((slot) => pressed.has(slot)) ?? null,
      isSprinting: held.has('sprint'),
      interact: pressed.has('interact'),
      turretToggle: pressed.has('turret-toggle-control'),
      turretAmmo: pressed.has('turret-switch-ammo'),
    };
  }
}
