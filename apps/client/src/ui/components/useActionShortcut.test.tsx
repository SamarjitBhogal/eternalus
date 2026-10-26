import type { ReactElement } from 'react';
import { describe, expect, it } from 'vitest';

import type { Binding, InputAction } from '../../bridge/Binding.types';
import { renderWithStore } from '../testStore';
import { bindLatestActionShortcut, useActionShortcut } from './useActionShortcut';

/** A component that only holds the shortcut, as `KeyPrompt` and `usePauseMenuKey` do. */
function ShortcutProbe({ action }: { readonly action: InputAction }): ReactElement {
  useActionShortcut(action, () => undefined);
  return <span>probe</span>;
}

const ESCAPE: readonly Binding[] = [
  { action: 'pause-menu', chords: [{ device: 'keyboard', code: 'Escape', label: 'Esc' }] },
];
const Q: readonly Binding[] = [
  { action: 'pause-menu', chords: [{ device: 'keyboard', code: 'KeyQ', label: 'Q' }] },
];

/** A cancelable key press of `code` (Node has no KeyboardEvent). */
const press = (code: string): Event =>
  Object.assign(new Event('keydown', { cancelable: true }), {
    code,
    repeat: false,
    ctrlKey: false,
    metaKey: false,
    altKey: false,
  });

/** The hook's two refs, as `useRef` hands them out. */
function refsOf(bindings: readonly Binding[], onPress: () => void) {
  return { bindings: { current: bindings }, onPress: { current: onPress } };
}

// The listener lifecycle (bubble phase, one listener per type, removal, bindings read at press
// time) is bindActionShortcut's, tested in Node by actionShortcut.test.ts; the hook only runs it
// in an effect, which a server render never does.
describe('useActionShortcut', () => {
  it('server-renders without touching window', () => {
    expect(typeof globalThis.window).toBe('undefined');
    expect(renderWithStore(<ShortcutProbe action="pause-menu" />)).toBe('<span>probe</span>');
  });
});

// The hook points the refs at the latest bindings and onPress after every render; these cases
// swap them as that effect does, without listening again.
describe('bindLatestActionShortcut', () => {
  it('calls the onPress current at press time, so a newer closure takes over (usePauseMenuKey)', () => {
    const target = new EventTarget();
    const calls: string[] = [];
    const refs = refsOf(ESCAPE, () => {
      calls.push('first');
    });
    const unbind = bindLatestActionShortcut(target, 'pause-menu', refs);

    target.dispatchEvent(press('Escape'));
    refs.onPress.current = () => {
      calls.push('second');
    };
    target.dispatchEvent(press('Escape'));

    expect(calls).toEqual(['first', 'second']);
    unbind();
  });

  it('matches the bindings current at press time, and nothing after unbind', () => {
    const target = new EventTarget();
    let presses = 0;
    const refs = refsOf(ESCAPE, () => {
      presses += 1;
    });
    const unbind = bindLatestActionShortcut(target, 'pause-menu', refs);

    refs.bindings.current = Q;
    target.dispatchEvent(press('Escape'));
    target.dispatchEvent(press('KeyQ'));
    expect(presses).toBe(1);

    unbind();
    target.dispatchEvent(press('KeyQ'));
    expect(presses).toBe(1);
  });
});
