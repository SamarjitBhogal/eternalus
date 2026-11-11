import type { Binding, InputAction } from '../../bridge/Binding.types';
import { chordKey } from '../../bridge/chordKey';

/** The parts of a key event a shortcut reads (plain objects satisfy it in Node tests). */
type ShortcutKey = Pick<KeyboardEvent, 'code' | 'repeat' | 'ctrlKey' | 'metaKey' | 'altKey'>;

/** Whether one of `action`'s chords is the physical input `chord` (identity by `chordKey`, DEC-30). */
function isBound(
  bindings: readonly Binding[],
  action: InputAction,
  chord: { readonly device: 'keyboard' | 'mouse'; readonly code: string },
): boolean {
  const key = chordKey(chord);
  return bindings.some(
    (binding) =>
      binding.action === action && binding.chords.some((bound) => chordKey(bound) === key),
  );
}

/** Whether `key` is a keyboard chord bound to `action` (chordKey, DEC-30); repeats and modified keys never match. */
export function matchesActionKey(
  bindings: readonly Binding[],
  action: InputAction,
  key: ShortcutKey,
): boolean {
  if (key.repeat || key.ctrlKey || key.metaKey || key.altKey) {
    return false;
  }
  return isBound(bindings, action, { device: 'keyboard', code: key.code });
}

/** Whether a mouse `button` is a chord bound to `action` (`{ device: 'mouse', code: String(button) }`, FR-080). */
export function matchesActionButton(
  bindings: readonly Binding[],
  action: InputAction,
  event: Pick<MouseEvent, 'button'>,
): boolean {
  return isBound(bindings, action, { device: 'mouse', code: String(event.button) });
}

/** A key event (the browser's `KeyboardEvent`, or an `Event` carrying the same fields in Node). */
export function isKeyEvent(event: Event): event is Event & ShortcutKey {
  return 'code' in event && typeof event.code === 'string';
}

/** A mouse or pointer event (`MouseEvent`, `PointerEvent`, or an `Event` with `button` in Node). */
export function isButtonEvent(event: Event): event is Event & Pick<MouseEvent, 'button'> {
  return 'button' in event && typeof event.button === 'number';
}

/**
 * Listens on `target` in the **bubble phase** for `keydown`, `pointerdown`, `auxclick` and `mouseup`:
 * a key or pointer press matching `action`'s current bindings calls `onPress` once and prevents its
 * default; a bound mouse button's `auxclick` and `mouseup` defaults are prevented too. Presses that
 * do not match are left alone. A capture-phase listener that stops propagation (the rebind capture
 * of `useBindingCapture`) therefore pre-empts it.
 * @returns Removes every listener it added (one per type).
 */
export function bindActionShortcut(
  target: Pick<EventTarget, 'addEventListener' | 'removeEventListener'>,
  getBindings: () => readonly Binding[],
  action: InputAction,
  onPress: () => void,
): () => void {
  const isBoundButton = (event: Event): boolean =>
    isButtonEvent(event) && matchesActionButton(getBindings(), action, event);
  const press = (event: Event): void => {
    event.preventDefault();
    onPress();
  };
  const onKeyDown = (event: Event): void => {
    if (isKeyEvent(event) && matchesActionKey(getBindings(), action, event)) press(event);
  };
  const onPointerDown = (event: Event): void => {
    if (isBoundButton(event)) press(event);
  };
  // A side button's browser default (history back/forward) runs on its release, not its press.
  const onRelease = (event: Event): void => {
    if (isBoundButton(event)) event.preventDefault();
  };
  const listeners = [
    ['keydown', onKeyDown],
    ['pointerdown', onPointerDown],
    ['auxclick', onRelease],
    ['mouseup', onRelease],
  ] as const;
  for (const [type, listener] of listeners) {
    target.addEventListener(type, listener);
  }
  return () => {
    for (const [type, listener] of listeners) {
      target.removeEventListener(type, listener);
    }
  };
}
