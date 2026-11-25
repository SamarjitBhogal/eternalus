// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest';

import type { Binding } from '../../bridge/Binding.types';
import { bindModalKeyFilter } from './modalKeyFilter';

const BINDINGS: readonly Binding[] = [
  { action: 'pause-menu', chords: [{ device: 'keyboard', code: 'Escape', label: 'Esc' }] },
];

function setUp() {
  const scope = document.createElement('div');
  const pressed: string[] = [];
  for (const name of ['Stay', 'Leave']) {
    const button = document.createElement('button');
    button.textContent = name;
    button.addEventListener('click', () => pressed.push(name));
    scope.append(button);
  }
  document.body.append(scope);
  const [stay, leave] = [...scope.querySelectorAll('button')];
  if (stay === undefined || leave === undefined) throw new Error('no buttons');
  const unbind = bindModalKeyFilter(
    window,
    () => BINDINGS,
    () => undefined,
    () => scope,
  );
  const key = (target: EventTarget, code: string, shiftKey = false): KeyboardEvent => {
    const event = new KeyboardEvent('keydown', { code, shiftKey, bubbles: true, cancelable: true });
    target.dispatchEvent(event);
    return event;
  };
  return { stay, leave, pressed, key, unbind, scope };
}

describe('bindModalKeyFilter with a focus scope', () => {
  it('moves the focus with Tab between the scope buttons, wrapping, and presses with Enter', () => {
    const { stay, leave, pressed, key, unbind, scope } = setUp();
    stay.focus();
    expect(key(stay, 'Tab').defaultPrevented).toBe(true);
    expect(document.activeElement).toBe(leave);
    key(leave, 'Enter');
    expect(pressed).toEqual(['Leave']);
    key(leave, 'Tab');
    expect(document.activeElement).toBe(stay);
    key(stay, 'Tab', true);
    expect(document.activeElement).toBe(leave);
    key(leave, 'Space');
    expect(pressed).toEqual(['Leave', 'Leave']);
    unbind();
    scope.remove();
  });

  it('presses nothing for Enter outside the scope', () => {
    const { pressed, key, unbind, scope } = setUp();
    const outside = document.createElement('button');
    document.body.append(outside);
    expect(key(outside, 'Enter').defaultPrevented).toBe(true);
    expect(pressed).toEqual([]);
    unbind();
    scope.remove();
    outside.remove();
  });
});
