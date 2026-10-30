import type { Binding } from '../../bridge/Binding.types';
import { isButtonEvent, isKeyEvent, matchesActionButton, matchesActionKey } from './actionShortcut';

/**
 * Keys whose browser default acts on the page under a full-screen view: moving the focus (Tab),
 * pressing the focused control (Enter, Space) and scrolling (the arrows, Page Up/Down, Home, End).
 */
const PAGE_KEYS: ReadonlySet<string> = new Set([
  'Tab',
  'Enter',
  'NumpadEnter',
  'Space',
  'ArrowUp',
  'ArrowDown',
  'ArrowLeft',
  'ArrowRight',
  'PageUp',
  'PageDown',
  'Home',
  'End',
]);

/**
 * "Disables all keys except Escape" while a full-screen view is open (DEC-65, DEC-103):
 * **capture-phase** listeners on `target` stop every key press before any other listener of the
 * page runs (the bubble-phase `actionShortcut`s of the step underneath, its Back included).
 * A press of a `pause-menu` key (Escape by default, as the Back prompts show it, HC-F7) calls
 * `onClose` once; every other key does nothing, and the page keys lose their default too, so the
 * focus cannot leave the view. Browser chords keep their default (reload, devtools). A mouse button
 * bound to an action (the left one is, to `attack`) is stopped the same way: its `pointerdown`, and
 * the `auxclick` and `mouseup` of its release, whose default would step a side button through the
 * history. One bound to `pause-menu` closes; the `click` that follows a press is never stopped, so
 * the view's own buttons still work, and an unbound button passes untouched.
 * @returns Removes the listeners.
 */
export function bindModalKeyFilter(
  target: Pick<EventTarget, 'addEventListener' | 'removeEventListener'>,
  getBindings: () => readonly Binding[],
  onClose: () => void,
): () => void {
  const onKeyDown = (event: Event): void => {
    if (!isKeyEvent(event)) return;
    event.stopImmediatePropagation();
    if (matchesActionKey(getBindings(), 'pause-menu', event)) {
      event.preventDefault();
      onClose();
    } else if (PAGE_KEYS.has(event.code)) {
      event.preventDefault();
    }
  };
  const onButton = (event: Event): void => {
    if (!isButtonEvent(event)) return;
    const bindings = getBindings();
    if (!bindings.some(({ action }) => matchesActionButton(bindings, action, event))) return;
    event.stopImmediatePropagation();
    if (event.type !== 'pointerdown') {
      event.preventDefault();
    } else if (matchesActionButton(bindings, 'pause-menu', event)) {
      event.preventDefault();
      onClose();
    }
  };
  const listeners = [
    ['keydown', onKeyDown],
    ['pointerdown', onButton],
    ['auxclick', onButton],
    ['mouseup', onButton],
  ] as const;
  for (const [type, listener] of listeners) {
    target.addEventListener(type, listener, { capture: true });
  }
  return () => {
    for (const [type, listener] of listeners) {
      target.removeEventListener(type, listener, { capture: true });
    }
  };
}
