import { emitIntent } from '../../bridge/eventBus';
import type { Overlay, UiIntent } from '../../bridge/events';
import { useAppStore } from '../../bridge/hooks';
import { selectIsDuel } from '../../bridge/selectors/selectIsDuel';
import { hudSlice } from '../../bridge/slices/hudSlice';
import { useActionShortcut } from '../components/useActionShortcut';

/** Where the element that had focus when the pause menu opened is kept (13 §7; CD-11). */
export type PauseOpenerRef = { current: Element | null };

/** The match state one press of the `pause-menu` key depends on, read from the store at keydown. */
type PauseKeyState = {
  /** An ability slot is selected for aiming (DEC-209 (3)). */
  readonly isAiming: boolean;
  /** The match is an online Duel, which has no pause menu (`selectIsDuel`). */
  readonly isDuel: boolean;
};

/**
 * What the `pause-menu` key asks for with `overlay` open: open the pause menu over the match,
 * close it, or go back to it from the settings (13 §6.4; 13 §7). In an online Duel there is no
 * pause menu: the key opens and closes the leave confirmation instead.
 */
export function pauseMenuKeyIntent(overlay: Overlay | null, isDuel = false): UiIntent {
  if (isDuel) {
    return overlay === null
      ? { kind: 'open-overlay', overlay: 'leave-duel' }
      : { kind: 'close-overlay' };
  }
  return overlay === 'pause'
    ? { kind: 'close-overlay' }
    : { kind: 'open-overlay', overlay: 'pause' };
}

/**
 * One press of the `pause-menu` key: when nothing is open, the focused element is stored in
 * `openerRef` **before** the intent is emitted, so it is captured before React commits `inert`
 * and Resume's autofocus (13 §7; CD-11); then the intent goes out. While an ability is selected for
 * aiming (`state.isAiming`) the key only cancels that selection with `cancel-aim` and no overlay
 * opens: not the pause menu, and in an online Duel (`state.isDuel`) not the leave confirmation
 * (DEC-209 (3)).
 */
export function pressPauseMenuKey<TElement>(
  overlay: Overlay | null,
  openerRef: { current: TElement | null },
  focus: { readonly activeElement: TElement | null },
  state: PauseKeyState,
): void {
  if (overlay === null && state.isAiming) {
    emitIntent({ kind: 'cancel-aim' });
    return;
  }
  if (overlay === null) openerRef.current = focus.activeElement;
  emitIntent(pauseMenuKeyIntent(overlay, state.isDuel));
}

/**
 * While mounted, the keys and mouse buttons bound to `pause-menu` (read at press time) open and
 * close the pause menu over the match, or in an online Duel the leave confirmation (or cancel an
 * aimed ability instead); the session pauses the match (13 §7; INBOX HC-Q8). Whether the player
 * aims and whether the match is a Duel are read from the store at press time. A rebind capture in
 * the embedded settings pre-empts it (capture phase, `bindActionShortcut`).
 */
export function usePauseMenuKey(overlay: Overlay | null, openerRef: PauseOpenerRef): void {
  const store = useAppStore();
  useActionShortcut('pause-menu', () => {
    const state = store.getState();
    pressPauseMenuKey(overlay, openerRef, document, {
      isAiming: hudSlice.selectors.selectAimingSlot(state) !== null,
      isDuel: selectIsDuel(state),
    });
  });
}
