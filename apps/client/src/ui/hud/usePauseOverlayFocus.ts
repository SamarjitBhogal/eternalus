import { type RefObject, useEffect, useRef } from 'react';

import type { Overlay } from '../../bridge/events';
import type { PauseOpenerRef } from './usePauseMenuKey';

/** An element the focus can go back to; an `HTMLElement` is one. */
type FocusTarget = { readonly isConnected: boolean; focus(): void };

/**
 * The overlay's focus restore as an effect body (I-72): while the overlay is open, the cleanup
 * React runs when it closes, which gives the focus back to `opener` (stored by the pause key
 * before the overlay opened) if that element is still in the document then. `undefined` while
 * closed.
 */
export function restoreFocusOnClose(
  isOpen: boolean,
  opener: FocusTarget | null,
): (() => void) | undefined {
  if (!isOpen) return undefined;
  return () => {
    if (opener?.isConnected === true) opener.focus();
  };
}

/**
 * The settings view focuses the dialog itself (it has no Resume to autofocus); the pause view and
 * a closed overlay leave the focus alone.
 */
export function focusDialogInSettings(
  overlay: Overlay | null,
  dialog: { focus(): void } | null,
): void {
  if (overlay === 'settings') dialog?.focus();
}

/**
 * The pause overlay's focus (13 §7; CD-11; I-72): when the overlay closes, the focus returns to
 * `openerRef`'s element if it is still in the document (`restoreFocusOnClose`). The restore
 * follows only whether the overlay is open, so switching between pause and settings never
 * restores. The settings view focuses the dialog (`focusDialogInSettings`).
 * @returns The ref for the dialog element.
 */
export function usePauseOverlayFocus(
  overlay: Overlay | null,
  openerRef: PauseOpenerRef,
): RefObject<HTMLDivElement | null> {
  const dialogRef = useRef<HTMLDivElement>(null);
  const isOpen = overlay !== null;
  useEffect(() => {
    // The pause key stored the opener before the overlay opened, so it is in place here.
    const opener = openerRef.current;
    return restoreFocusOnClose(isOpen, opener instanceof HTMLElement ? opener : null);
  }, [isOpen, openerRef]);
  useEffect(() => {
    focusDialogInSettings(overlay, dialogRef.current);
  }, [overlay]);
  return dialogRef;
}
