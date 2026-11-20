import { emitIntent } from '../../bridge/eventBus';
import type { Overlay, UiIntent } from '../../bridge/events';
import { useAppStore } from '../../bridge/hooks';
import { hudSlice } from '../../bridge/slices/hudSlice';
import { useActionShortcut } from '../components/useActionShortcut';

/** Where the element that had focus when the pause menu opened is kept (13 §7; CD-11). */
export type PauseOpenerRef = { current: Element | null };

/**
 * What the `pause-menu` key asks for with `overlay` open: open the pause menu over the match,
 * close it, or go back to it from the settings (13 §6.4; 13 §7).
 */
export function pauseMenuKeyIntent(overlay: Overlay | null): UiIntent {
  return overlay === 'pause'
    ? { kind: 'close-overlay' }
    : { kind: 'open-overlay', overlay: 'pause' };
}

/**
 * One press of the `pause-menu` key: when nothing is open, the focused element is stored in
 * `openerRef` **before** the intent is emitted, so it is captured before React commits `inert`
 * and Resume's autofocus (13 §7; CD-11); then the intent goes out. While an ability is selected for
 * aiming (`isAiming`, read from the store at keydown) the key only cancels that selection with
 * `cancel-aim` and the pause menu stays shut (DEC-209 (3)).
 */
export function pressPauseMenuKey<TElement>(
  overlay: Overlay | null,
  openerRef: { current: TElement | null },
  focus: { readonly activeElement: TElement | null },
  isAiming: boolean,
): void {
  if (overlay === null && isAiming) {
    emitIntent({ kind: 'cancel-aim' });
    return;
  }
  if (overlay === null) openerRef.current = focus.activeElement;
  emitIntent(pauseMenuKeyIntent(overlay));
}

/**
 * While mounted, the keys and mouse buttons bound to `pause-menu` (read at press time) open and
 * close the pause menu over the match (or cancel an aimed ability instead); the session pauses the match (13 §7; INBOX HC-Q8). A
 * rebind capture in the embedded settings pre-empts it (capture phase, `bindActionShortcut`).
 */
export function usePauseMenuKey(overlay: Overlay | null, openerRef: PauseOpenerRef): void {
  const store = useAppStore();
  useActionShortcut('pause-menu', () => {
    pressPauseMenuKey(
      overlay,
      openerRef,
      document,
      hudSlice.selectors.selectAimingSlot(store.getState()) !== null,
    );
  });
}
