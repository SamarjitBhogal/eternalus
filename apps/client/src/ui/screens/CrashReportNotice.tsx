import { type ReactElement, useEffect, useId, useRef, useState } from 'react';

import type { CrashReportState } from '../../bridge/CrashReport.types';
import { emitIntent } from '../../bridge/eventBus';
import { useAppSelector } from '../../bridge/hooks';
import { sessionSlice } from '../../bridge/slices/sessionSlice';
import { Button } from '../components/Button';
import { STRINGS } from '../strings';
import styles from './CrashReportNotice.module.css';
import { dismissOnCancel } from './SelectTimeoutNotice';

const { crashReportPopup: text } = STRINGS;

/** Puts `value` on the clipboard; a page without clipboard access just does nothing. */
async function copyToClipboard(value: string): Promise<void> {
  try {
    await navigator.clipboard.writeText(value);
  } catch {
    // The report text stays in the box below the button, to select by hand.
  }
}

/**
 * The popup over the menu after a crash (DEC-106, DEC-124; ADR 0025 §5): a modal `<dialog>` with
 * what stopped (the match or a screen, from the report's `cause`), the optional note and two
 * buttons, "Save note and return to menu" and "Return to menu". While the note saves the buttons
 * are off; once saved it says where. When the report could not be saved it adds the report as
 * text and a "Copy report" button (DEC-124 (c)); when only the note could not be saved it says so
 * and offers the note text to copy. `App` mounts it outside the `ErrorBoundary`; the session opens
 * and closes it through `crash-report`, and Escape dismisses it.
 */
export function CrashReportNotice(): ReactElement | null {
  const report = useAppSelector(sessionSlice.selectors.selectCrashReport);
  // The key is the crash number: a second crash while the popup is open starts a new dialog.
  return report === null ? null : <CrashReportDialog key={report.crashNumber} report={report} />;
}

/** The open popup; one per crash, so the note starts empty for each one. */
function CrashReportDialog({ report }: { readonly report: CrashReportState }): ReactElement {
  const [note, setNote] = useState('');
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const noteId = useId();
  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog === null) return undefined;
    if (!dialog.open) dialog.showModal();
    return () => {
      dialog.close();
    };
  }, []);
  const dismiss = (): void => {
    emitIntent({ kind: 'dismiss-crash-report' });
  };
  const isSaving = report.stage === 'saving';
  const canEdit = report.stage !== 'saved';
  return (
    <dialog
      ref={dialogRef}
      className={styles.dialog}
      aria-labelledby={titleId}
      onCancel={dismissOnCancel(dismiss)}
    >
      <h2 id={titleId} className={styles.title}>
        {report.cause === 'screen' ? text.screenMessage : text.matchMessage}
      </h2>
      {report.stage === 'saved' && <p className={styles.text}>{text.saved(report.file)}</p>}
      {report.stage === 'copy' && (
        <div className={styles.field}>
          <p className={styles.text}>
            {report.isReportSaved ? text.noteNotSavedMessage : text.copyMessage}
          </p>
          <textarea
            readOnly
            className={styles.report}
            aria-label={text.reportLabel}
            rows={8}
            value={report.copyText}
          />
        </div>
      )}
      {isSaving && (
        <p role="status" className={styles.text}>
          {text.saving}
        </p>
      )}
      {canEdit && (
        <div className={styles.field}>
          <label htmlFor={noteId}>{text.notePrompt}</label>
          <textarea
            id={noteId}
            className={styles.note}
            autoFocus={report.stage === 'asking'}
            maxLength={report.noteLimit}
            disabled={isSaving}
            rows={4}
            value={note}
            onChange={(event) => {
              setNote(event.target.value);
            }}
          />
        </div>
      )}
      <div className={styles.actions}>
        {canEdit && (
          <Button
            isDisabled={isSaving}
            onClick={() => {
              emitIntent({ kind: 'save-crash-note', note });
            }}
          >
            {text.saveNote}
          </Button>
        )}
        {report.stage === 'copy' && (
          <Button
            onClick={() => {
              void copyToClipboard(report.copyText);
            }}
          >
            {text.copyReport}
          </Button>
        )}
        <Button autoFocus={report.stage === 'saved'} onClick={dismiss}>
          {text.returnToMenu}
        </Button>
      </div>
    </dialog>
  );
}
