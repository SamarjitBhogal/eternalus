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

/** Keys that press the focused control; inside a focus scope they keep their default. */
const ACTIVATION_KEYS: ReadonlySet<string> = new Set(['Enter', 'NumpadEnter', 'Space']);

/**
 * Moves the focus to the next (or, with Shift, the previous) enabled button in `scope`, wrapping
 * at either end, so Tab walks the view's own controls and never leaves it.
 */
function moveFocusWithin(scope: Element, isBackward: boolean): void {
  const controls = [...scope.querySelectorAll<HTMLElement>('button:not([disabled])')];
  if (controls.length === 0) return;
  const at = controls.findIndex((control) => control === scope.ownerDocument.activeElement);
  const step = isBackward ? -1 : 1;
  const next = at === -1 ? (isBackward ? controls.length - 1 : 0) : at + step;
  controls.at(next % controls.length)?.focus();
}

/** Whether `node` (an event's target) is inside `scope`. */
function isInside(scope: Element, node: EventTarget | null): node is HTMLElement {
  return node instanceof HTMLElement && scope.contains(node);
}

/**
 * Takes the default of mouse `button`'s coming release on `target` (its `mouseup`, then the
 * `auxclick` that ends it), so a side button that closed a view cannot step the history after the
 * view's own listeners are gone (DEC-112). The next press ends it too, in case the release came
 * outside the page.
 */
function preventReleaseDefault(
  target: Pick<EventTarget, 'addEventListener' | 'removeEventListener'>,
  button: number,
): void {
  const onRelease = (event: Event): void => {
    if (!isButtonEvent(event) || event.button !== button) return;
    event.preventDefault();
    if (event.type === 'auxclick') stop();
  };
  const listeners = [
    ['mouseup', onRelease],
    ['auxclick', onRelease],
    ['pointerdown', stop],
  ] as const;
  function stop(): void {
    for (const [type, listener] of listeners) {
      target.removeEventListener(type, listener, { capture: true });
    }
  }
  for (const [type, listener] of listeners) {
    target.addEventListener(type, listener, { capture: true });
  }
}

/**
 * "Disables all keys except Escape" while a full-screen view is open (DEC-65, DEC-103):
 * **capture-phase** listeners on `target` stop every key press before any other listener of the
 * page runs (the bubble-phase `actionShortcut`s of the step underneath, its Back included).
 * A press of a `pause-menu` key (Escape by default, as the Back prompts show it, HC-F7) calls
 * `onClose` once; every other key does nothing, and the page keys lose their default too, so the
 * focus cannot leave the view. Browser chords keep their default (reload, devtools). A mouse button
 * bound to an action (the left one is, to `attack`) is stopped the same way: its `pointerdown`, and
 * the `auxclick` and `mouseup` of its release, whose default would step a side button through the
 * history. One bound to `pause-menu` closes on its press, and that press's release still loses its
 * default once the view has closed (`preventReleaseDefault`, DEC-112). The `click` that follows a
 * press is never stopped, so the view's own buttons still work, and an unbound button passes
 * untouched. With a focus scope (`getScope`, a dialog with buttons), the view is operable by
 * keyboard alone (13 §7): Tab and Shift+Tab move the focus between the scope's buttons, wrapping,
 * and Enter and Space press the focused control inside the scope (their own default is taken, so a
 * press never counts twice).
 * @returns Removes the listeners.
 */
export function bindModalKeyFilter(
  target: Pick<EventTarget, 'addEventListener' | 'removeEventListener'>,
  getBindings: () => readonly Binding[],
  onClose: () => void,
  getScope: () => Element | null = () => null,
): () => void {
  const onKeyDown = (event: Event): void => {
    if (!isKeyEvent(event)) return;
    event.stopImmediatePropagation();
    if (matchesActionKey(getBindings(), 'pause-menu', event)) {
      event.preventDefault();
      onClose();
      return;
    }
    if (!PAGE_KEYS.has(event.code)) return;
    event.preventDefault();
    const scope = getScope();
    if (scope === null) return;
    if (event.code === 'Tab') {
      moveFocusWithin(scope, 'shiftKey' in event && event.shiftKey === true);
    } else if (ACTIVATION_KEYS.has(event.code) && isInside(scope, event.target)) {
      event.target.click();
    }
  };
  // Space presses a button on its release: take that default too, or the press above would repeat.
  const onKeyUp = (event: Event): void => {
    if (!isKeyEvent(event) || !ACTIVATION_KEYS.has(event.code)) return;
    const scope = getScope();
    if (scope !== null && isInside(scope, event.target)) event.preventDefault();
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
      preventReleaseDefault(target, event.button);
      onClose();
    }
  };
  const listeners = [
    ['keydown', onKeyDown],
    ['keyup', onKeyUp],
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
