import { emitIntent } from '../../bridge/eventBus';
import type { Overlay, UiIntent } from '../../bridge/events';
import { useActionShortcut } from '../components/useActionShortcut';

/** Where the element that had focus when the pause menu opened is kept (I-72). */
export type PauseOpenerRef = { current: Element | null };

/**
 * What the `pause-menu` key asks for with `overlay` open: open the pause menu over the match,
 * close it, or go back to it from the settings (13 §6.4, I-48).
 */
export function pauseMenuKeyIntent(overlay: Overlay | null): UiIntent {
  return overlay === 'pause'
    ? { kind: 'close-overlay' }
    : { kind: 'open-overlay', overlay: 'pause' };
}

/**
 * One press of the `pause-menu` key: when nothing is open, the focused element is stored in
 * `openerRef` **before** the intent is emitted, so it is captured before React commits `inert`
 * and Resume's autofocus (I-72); then the intent goes out.
 */
export function pressPauseMenuKey<TElement>(
  overlay: Overlay | null,
  openerRef: { current: TElement | null },
  focus: { readonly activeElement: TElement | null },
): void {
  if (overlay === null) openerRef.current = focus.activeElement;
  emitIntent(pauseMenuKeyIntent(overlay));
}

/**
 * While mounted, the keys and mouse buttons bound to `pause-menu` (read at press time) open and
 * close the pause menu over the match; the session pauses the match (I-48). A rebind capture in
 * the embedded settings pre-empts it (capture phase, `bindActionShortcut`).
 */
export function usePauseMenuKey(overlay: Overlay | null, openerRef: PauseOpenerRef): void {
  useActionShortcut('pause-menu', () => {
    pressPauseMenuKey(overlay, openerRef, document);
  });
}
