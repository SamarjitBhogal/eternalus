import type { ReactElement } from 'react';

import { chordKey } from '../../bridge/chordKey';
import { emitIntent } from '../../bridge/eventBus';
import { useAppSelector } from '../../bridge/hooks';
import { settingsSlice } from '../../bridge/slices/settingsSlice';
import { ACTION_LABELS, STRINGS } from '../strings';
import styles from './SettingsScreenControls.module.css';
import { CAPTURE_EXEMPT, useBindingCapture } from './useBindingCapture';

const { selectBindings, selectChordOwner } = settingsSlice.selectors;
const exempt = { [CAPTURE_EXEMPT]: true };

/**
 * The Controls tab: every action with its chords. Selecting a row (Enter or click) listens for
 * the next key or mouse button; Enter saves, Esc cancels, and a conflict offers swap or replace.
 */
export function SettingsScreenControls(): ReactElement {
  const bindings = useAppSelector(selectBindings);
  const capture = useBindingCapture();
  const { state } = capture;
  const pending = state.step === 'confirming' ? state : null;
  const owner = useAppSelector((root) =>
    pending === null ? null : selectChordOwner(root, pending.chord),
  );
  const conflict = pending !== null && owner !== null && owner !== pending.action ? owner : null;

  return (
    <div
      className={styles.controls}
      onPointerDown={capture.onPointerDown}
      onContextMenu={capture.onSuppressible}
      onAuxClick={capture.onSuppressible}
    >
      <ul className={styles.list}>
        {bindings.map(({ action, chords }) => {
          const isCapturing = state.step !== 'idle' && state.action === action;
          return (
            <li key={action} className={styles.row}>
              <button
                type="button"
                className={styles.rebind}
                data-capturing={isCapturing}
                onClick={() => {
                  capture.start(action);
                }}
              >
                <span className={styles.action}>{ACTION_LABELS[action]}</span>
                <span className={styles.chords}>
                  {state.step === 'listening' && isCapturing && STRINGS.settings.listening}
                  {pending?.action === action && (
                    <kbd className={styles.chord}>{pending.chord.label}</kbd>
                  )}
                  {!isCapturing &&
                    (chords.length === 0
                      ? STRINGS.unbound
                      : chords.map((chord) => (
                          <kbd key={chordKey(chord)} className={styles.chord}>
                            {chord.label}
                          </kbd>
                        )))}
                </span>
              </button>
              <button
                type="button"
                className={styles.reset}
                aria-label={STRINGS.settings.resetLabel(ACTION_LABELS[action])}
                {...exempt}
                onClick={() => {
                  emitIntent({ kind: 'reset-bindings', action });
                }}
              >
                {STRINGS.settings.reset}
              </button>
            </li>
          );
        })}
      </ul>
      {pending !== null && (
        <div
          role="alertdialog"
          aria-label={STRINGS.settings.title}
          className={styles.dialog}
          {...exempt}
        >
          <p>
            {conflict === null
              ? STRINGS.settings.confirm
              : STRINGS.settings.conflict(pending.chord.label, ACTION_LABELS[conflict])}
          </p>
          {conflict === null ? (
            <button
              type="button"
              autoFocus
              onClick={() => {
                capture.save('swap');
              }}
            >
              {STRINGS.settings.save}
            </button>
          ) : (
            <>
              <button
                type="button"
                autoFocus
                onClick={() => {
                  capture.save('swap');
                }}
              >
                {STRINGS.settings.swap}
              </button>
              <button
                type="button"
                onClick={() => {
                  capture.save('replace');
                }}
              >
                {STRINGS.settings.replace}
              </button>
            </>
          )}
          <button type="button" onClick={capture.cancel}>
            {STRINGS.settings.cancel}
          </button>
        </div>
      )}
      <button
        type="button"
        className={styles.resetAll}
        {...exempt}
        onClick={() => {
          emitIntent({ kind: 'reset-bindings', action: null });
        }}
      >
        {STRINGS.settings.resetAll}
      </button>
    </div>
  );
}
