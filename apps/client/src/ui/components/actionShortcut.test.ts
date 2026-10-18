import { describe, expect, it } from 'vitest';

import type { Binding } from '../../bridge/Binding.types';
import { bindActionShortcut, matchesActionButton, matchesActionKey } from './actionShortcut';

const ESCAPE = { device: 'keyboard', code: 'Escape', label: 'Esc' } as const;
const MOUSE_4 = { device: 'mouse', code: '3', label: 'Mouse 4' } as const;
const PAUSE_ON_ESCAPE: readonly Binding[] = [{ action: 'pause-menu', chords: [ESCAPE] }];
const PAUSE_ON_ESCAPE_AND_MOUSE_4: readonly Binding[] = [
  { action: 'pause-menu', chords: [ESCAPE, MOUSE_4] },
];

const KEY = { code: 'Escape', repeat: false, ctrlKey: false, metaKey: false, altKey: false };

/** A cancelable event carrying the fields of a key or mouse event (Node has no KeyboardEvent). */
function eventOf(type: string, fields: Readonly<Record<string, unknown>>): Event {
  return Object.assign(new Event(type, { cancelable: true }), fields);
}
const keydown = (fields: Partial<typeof KEY> = {}): Event =>
  eventOf('keydown', { ...KEY, ...fields });

/** Counts the listeners added and removed per type, and records whether any asked for capture. */
class CountingTarget extends EventTarget {
  readonly added = new Map<string, number>();
  readonly removed = new Map<string, number>();
  readonly captureRequests: unknown[] = [];

  override addEventListener(
    type: string,
    callback: EventListenerOrEventListenerObject | null,
    options?: AddEventListenerOptions | boolean,
  ): void {
    this.added.set(type, (this.added.get(type) ?? 0) + 1);
    this.captureRequests.push(typeof options === 'object' ? options.capture : options);
    super.addEventListener(type, callback, options);
  }

  override removeEventListener(
    type: string,
    callback: EventListenerOrEventListenerObject | null,
    options?: EventListenerOptions | boolean,
  ): void {
    this.removed.set(type, (this.removed.get(type) ?? 0) + 1);
    super.removeEventListener(type, callback, options);
  }
}

describe('matchesActionKey', () => {
  it('matches the bound key and follows a rebinding', () => {
    expect(matchesActionKey(PAUSE_ON_ESCAPE, 'pause-menu', KEY)).toBe(true);
    const rebound: readonly Binding[] = [
      { action: 'pause-menu', chords: [{ device: 'keyboard', code: 'KeyQ', label: 'Q' }] },
    ];
    expect(matchesActionKey(rebound, 'pause-menu', { ...KEY, code: 'KeyQ' })).toBe(true);
    expect(matchesActionKey(rebound, 'pause-menu', KEY)).toBe(false);
  });

  it('never matches a repeat or a modified key', () => {
    expect(matchesActionKey(PAUSE_ON_ESCAPE, 'pause-menu', { ...KEY, repeat: true })).toBe(false);
    expect(matchesActionKey(PAUSE_ON_ESCAPE, 'pause-menu', { ...KEY, ctrlKey: true })).toBe(false);
    expect(matchesActionKey(PAUSE_ON_ESCAPE, 'pause-menu', { ...KEY, metaKey: true })).toBe(false);
    expect(matchesActionKey(PAUSE_ON_ESCAPE, 'pause-menu', { ...KEY, altKey: true })).toBe(false);
  });

  it('does not match a key bound to another action', () => {
    expect(matchesActionKey(PAUSE_ON_ESCAPE, 'gadget-2', KEY)).toBe(false);
  });
});

describe('matchesActionButton', () => {
  it('matches a mouse chord by its button number', () => {
    expect(matchesActionButton(PAUSE_ON_ESCAPE_AND_MOUSE_4, 'pause-menu', { button: 3 })).toBe(
      true,
    );
    expect(matchesActionButton(PAUSE_ON_ESCAPE_AND_MOUSE_4, 'pause-menu', { button: 0 })).toBe(
      false,
    );
  });
});

describe('bindActionShortcut', () => {
  it('calls onPress once for a matching key and prevents its default', () => {
    const target = new EventTarget();
    let presses = 0;
    bindActionShortcut(
      target,
      () => PAUSE_ON_ESCAPE,
      'pause-menu',
      () => {
        presses += 1;
      },
    );

    const match = keydown();
    target.dispatchEvent(match);

    expect(presses).toBe(1);
    expect(match.defaultPrevented).toBe(true);
  });

  it('leaves a non-matching key and a repeat alone', () => {
    const target = new EventTarget();
    let presses = 0;
    bindActionShortcut(
      target,
      () => PAUSE_ON_ESCAPE,
      'pause-menu',
      () => {
        presses += 1;
      },
    );

    const other = keydown({ code: 'KeyQ' });
    const repeat = keydown({ repeat: true });
    target.dispatchEvent(other);
    target.dispatchEvent(repeat);

    expect(presses).toBe(0);
    expect(other.defaultPrevented).toBe(false);
    expect(repeat.defaultPrevented).toBe(false);
  });

  it('presses on a bound mouse button and suppresses its auxclick and mouseup until unbound', () => {
    const target = new EventTarget();
    let presses = 0;
    const unbind = bindActionShortcut(
      target,
      () => PAUSE_ON_ESCAPE_AND_MOUSE_4,
      'pause-menu',
      () => {
        presses += 1;
      },
    );

    const down = eventOf('pointerdown', { button: 3 });
    const aux = eventOf('auxclick', { button: 3 });
    const up = eventOf('mouseup', { button: 3 });
    const mainDown = eventOf('pointerdown', { button: 0 });
    for (const event of [down, aux, up, mainDown]) target.dispatchEvent(event);

    expect(presses).toBe(1);
    expect([down, aux, up].map((event) => event.defaultPrevented)).toEqual([true, true, true]);
    expect(mainDown.defaultPrevented).toBe(false);

    unbind();
    const auxAfter = eventOf('auxclick', { button: 3 });
    const upAfter = eventOf('mouseup', { button: 3 });
    target.dispatchEvent(auxAfter);
    target.dispatchEvent(upAfter);
    expect(auxAfter.defaultPrevented).toBe(false);
    expect(upAfter.defaultPrevented).toBe(false);
  });

  it('reads the bindings at press time', () => {
    const target = new EventTarget();
    let bindings: readonly Binding[] = PAUSE_ON_ESCAPE;
    let presses = 0;
    bindActionShortcut(
      target,
      () => bindings,
      'pause-menu',
      () => {
        presses += 1;
      },
    );

    bindings = [
      { action: 'pause-menu', chords: [{ device: 'keyboard', code: 'KeyQ', label: 'Q' }] },
    ];
    target.dispatchEvent(keydown());
    target.dispatchEvent(keydown({ code: 'KeyQ' }));

    expect(presses).toBe(1);
  });

  it('adds one bubble-phase listener per type and removes every one it added', () => {
    const target = new CountingTarget();
    const unbind = bindActionShortcut(
      target,
      () => PAUSE_ON_ESCAPE,
      'pause-menu',
      () => undefined,
    );

    const types = ['keydown', 'pointerdown', 'auxclick', 'mouseup'];
    expect(Object.fromEntries(target.added)).toEqual(Object.fromEntries(types.map((t) => [t, 1])));
    expect(target.captureRequests).toEqual([undefined, undefined, undefined, undefined]);

    unbind();
    expect(Object.fromEntries(target.removed)).toEqual(Object.fromEntries(target.added));
  });

  it('fires nothing after unbind, and a second bind gives one call per press', () => {
    const target = new EventTarget();
    let presses = 0;
    const onPress = (): void => {
      presses += 1;
    };

    bindActionShortcut(target, () => PAUSE_ON_ESCAPE, 'pause-menu', onPress)();
    target.dispatchEvent(keydown());
    expect(presses).toBe(0);

    const unbind = bindActionShortcut(target, () => PAUSE_ON_ESCAPE, 'pause-menu', onPress);
    target.dispatchEvent(keydown());
    target.dispatchEvent(keydown());
    expect(presses).toBe(2);
    unbind();
  });
});
