import { useCallback, useEffect, useRef, useState } from 'react';

import { restoreFocusOnClose } from '../hud/usePauseOverlayFocus';

/** Whether View Details is open, and its two actions. */
type ViewDetailsToggle = {
  readonly isOpen: boolean;
  readonly open: () => void;
  readonly close: () => void;
};

/**
 * A selection step's View Details (DEC-103): closed at first; `open` (the V prompt) keeps the
 * element that had the focus, and closing gives the focus back to it if it is still in the page
 * (`restoreFocusOnClose`, as the pause overlay does).
 */
export function useViewDetails(): ViewDetailsToggle {
  const [isOpen, setOpen] = useState(false);
  const openerRef = useRef<Element | null>(null);
  useEffect(() => {
    const opener = openerRef.current;
    return restoreFocusOnClose(isOpen, opener instanceof HTMLElement ? opener : null);
  }, [isOpen]);
  const open = useCallback(() => {
    openerRef.current = document.activeElement;
    setOpen(true);
  }, []);
  const close = useCallback(() => {
    setOpen(false);
  }, []);
  return { isOpen, open, close };
}
