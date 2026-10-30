import { describe, expect, it } from 'vitest';

import type { Binding } from '../../bridge/Binding.types';
import { bindActionShortcut } from './actionShortcut';
import { bindModalKeyFilter } from './modalKeyFilter';

const ESCAPE = { device: 'keyboard', code: 'Escape', label: 'Esc' } as const;
const DEFAULTS: readonly Binding[] = [
  { action: 'pause-menu', chords: [ESCAPE] },
  { action: 'view-details', chords: [{ device: 'keyboard', code: 'KeyV', label: 'V' }] },
];
const PAUSE_ON_Q: readonly Binding[] = [
  { action: 'pause-menu', chords: [{ device: 'keyboard', code: 'KeyQ', label: 'Q' }] },
];
/** Back on Mouse 4 (button 3) beside Escape, View Details on Mouse 5 (button 4). */
const MOUSE_BOUND: readonly Binding[] = [
  { action: 'pause-menu', chords: [ESCAPE, { device: 'mouse', code: '3', label: 'Mouse 4' }] },
  { action: 'view-details', chords: [{ device: 'mouse', code: '4', label: 'Mouse 5' }] },
];

/** A cancelable key press of `code` (Node has no KeyboardEvent). */
const press = (code: string, fields: Readonly<Record<string, unknown>> = {}): Event =>
  Object.assign(new Event('keydown', { cancelable: true }), {
    code,
    repeat: false,
    ctrlKey: false,
    metaKey: false,
    altKey: false,
    ...fields,
  });

/** A cancelable `type` event of mouse `button` (Node has no PointerEvent). */
const click = (type: string, button: number): Event =>
  Object.assign(new Event(type, { cancelable: true }), { button });

/** Records the options each listener was added with. */
class OptionsTarget extends EventTarget {
  readonly options: unknown[] = [];

  override addEventListener(
    type: string,
    callback: EventListenerOrEventListenerObject | null,
    options?: AddEventListenerOptions | boolean,
  ): void {
    this.options.push(options);
    super.addEventListener(type, callback, options);
  }
}

/**
 * The filter, then the step's own shortcuts on the same target: Node's EventTarget has no tree, so
 * the filter is added first, as the capture phase runs it first in a browser.
 */
function setUp(bindings: readonly Binding[] = DEFAULTS) {
  const target = new OptionsTarget();
  const calls: string[] = [];
  const unbind = bindModalKeyFilter(
    target,
    () => bindings,
    () => {
      calls.push('close');
    },
  );
  for (const action of ['pause-menu', 'view-details'] as const) {
    bindActionShortcut(
      target,
      () => bindings,
      action,
      () => {
        calls.push(action);
      },
    );
  }
  return { target, calls, unbind };
}

describe('bindModalKeyFilter', () => {
  it('listens in the capture phase, so it runs before every bubble-phase shortcut', () => {
    const { target } = setUp();

    expect(target.options[0]).toEqual({ capture: true });
  });

  // DEC-65 / DEC-103: only Escape works while View Details is open.
  it('closes on Escape once and keeps the step’s Back from running', () => {
    const { target, calls } = setUp();
    const escape = press('Escape');

    target.dispatchEvent(escape);

    expect(calls).toEqual(['close']);
    expect(escape.defaultPrevented).toBe(true);
  });

  it('stops every other key: V does not reach its shortcut and does not close', () => {
    const { target, calls } = setUp();
    const v = press('KeyV');

    target.dispatchEvent(v);

    expect(calls).toEqual([]);
    expect(v.defaultPrevented).toBe(false);
  });

  it.each(['Tab', 'Enter', 'Space', 'ArrowLeft'])(
    'takes the page default from %s, so the focus cannot leave the view',
    (code) => {
      const { target, calls } = setUp();
      const key = press(code);

      target.dispatchEvent(key);

      expect(calls).toEqual([]);
      expect(key.defaultPrevented).toBe(true);
    },
  );

  it('follows a rebound pause-menu key and ignores a held Escape', () => {
    const { target, calls } = setUp(PAUSE_ON_Q);

    target.dispatchEvent(press('Escape'));
    target.dispatchEvent(press('KeyQ', { repeat: true }));
    target.dispatchEvent(press('KeyQ'));

    expect(calls).toEqual(['close']);
  });

  it('closes on a mouse-bound pause-menu button once and keeps the step’s Back from running', () => {
    const { target, calls } = setUp(MOUSE_BOUND);
    const back = click('pointerdown', 3);
    const release = click('mouseup', 3);
    const aux = click('auxclick', 3);

    target.dispatchEvent(back);
    target.dispatchEvent(release);
    target.dispatchEvent(aux);

    expect(calls).toEqual(['close']);
    expect([back, release, aux].map((event) => event.defaultPrevented)).toEqual([true, true, true]);
  });

  it('stops every other bound button and lets an unbound one through', () => {
    const { target, calls } = setUp(MOUSE_BOUND);
    const details = click('pointerdown', 4);
    const unbound = click('pointerdown', 1);

    target.dispatchEvent(details);
    target.dispatchEvent(unbound);

    expect(calls).toEqual([]);
    expect(details.defaultPrevented).toBe(false);
    expect(unbound.defaultPrevented).toBe(false);
  });

  it('listens to the buttons in the capture phase too', () => {
    const { target } = setUp();

    expect(target.options.slice(0, 4)).toEqual(Array(4).fill({ capture: true }));
  });

  it('lets every key through again once removed', () => {
    const { target, calls, unbind } = setUp();

    unbind();
    target.dispatchEvent(press('Escape'));

    expect(calls).toEqual(['pause-menu']);
  });

  it('lets every bound button through again once removed', () => {
    const { target, calls, unbind } = setUp(MOUSE_BOUND);

    unbind();
    target.dispatchEvent(click('pointerdown', 3));

    expect(calls).toEqual(['pause-menu']);
  });
});
