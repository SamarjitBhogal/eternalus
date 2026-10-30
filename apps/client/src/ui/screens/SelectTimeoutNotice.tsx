import { type ReactElement, useEffect, useId, useRef, useState } from 'react';

import { useAppSelector } from '../../bridge/hooks';
import { sessionSlice } from '../../bridge/slices/sessionSlice';
import { Button } from '../components/Button';
import { STRINGS } from '../strings';
import styles from './SelectTimeoutNotice.module.css';

const { selectTimeoutPopup: text } = STRINGS;

/** A dialog's `cancel` event (Escape) as the handler reads it. */
type CancelEvent = { preventDefault(): void };

/**
 * The dialog's Escape handler: it keeps the browser from closing the dialog itself and dismisses
 * it, as the close control does.
 */
export function dismissOnCancel(dismiss: () => void): (event: CancelEvent) => void {
  return (event) => {
    event.preventDefault();
    dismiss();
  };
}

/**
 * The popup over the home screen after the select countdown ended before LOCK IN (DEC-102): a
 * modal `<dialog>` (the page behind it is inert) with the title, the text and one close control,
 * which takes the focus. The close control (Enter or a click) and Escape dismiss it. `App` mounts
 * it for the whole `menu` phase, so it stays dismissed across menu routes and shows again only
 * after the next timeout.
 */
export function SelectTimeoutNotice(): ReactElement | null {
  const reason = useAppSelector(sessionSlice.selectors.selectSessionReason);
  const [isDismissed, setDismissed] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const textId = useId();
  const isOpen = reason === 'select-timeout' && !isDismissed;
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!isOpen || dialog === null) return undefined;
    if (!dialog.open) dialog.showModal();
    return () => {
      dialog.close();
    };
  }, [isOpen]);
  if (!isOpen) return null;
  const dismiss = (): void => {
    setDismissed(true);
  };
  return (
    <dialog
      ref={dialogRef}
      className={styles.dialog}
      aria-labelledby={titleId}
      aria-describedby={textId}
      onCancel={dismissOnCancel(dismiss)}
    >
      <h2 id={titleId} className={styles.title}>
        {text.title}
      </h2>
      <p id={textId} className={styles.text}>
        {text.text}
      </p>
      <div className={styles.actions}>
        <Button autoFocus onClick={dismiss}>
          {text.close}
        </Button>
      </div>
    </dialog>
  );
}
