import type { Binding } from '../../bridge/Binding.types';
import { isKeyEvent, matchesActionKey } from './actionShortcut';

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
 * "Disables all keys except Escape" while a full-screen view is open (DEC-65, DEC-103): one
 * **capture-phase** `keydown` listener on `target` stops every key press before any other listener
 * of the page runs (the bubble-phase `actionShortcut`s of the step underneath, its Back included).
 * A press of a `pause-menu` key (Escape by default, as the Back prompts show it, HC-F7) calls
 * `onClose` once; every other key does nothing, and the page keys lose their default too, so the
 * focus cannot leave the view. Browser chords keep their default (reload, devtools).
 * @returns Removes the listener.
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
  target.addEventListener('keydown', onKeyDown, { capture: true });
  return () => {
    target.removeEventListener('keydown', onKeyDown, { capture: true });
  };
}
