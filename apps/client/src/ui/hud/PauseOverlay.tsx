import { type ReactElement, useId } from 'react';

import { emitIntent } from '../../bridge/eventBus';
import { useAppSelector } from '../../bridge/hooks';
import { Button } from '../components/Button';
import { SettingsScreen } from '../screens/SettingsScreen';
import { STRINGS } from '../strings';
import styles from './PauseOverlay.module.css';
import type { PauseOpenerRef } from './usePauseMenuKey';
import { usePauseOverlayFocus } from './usePauseOverlayFocus';

/**
 * The in-match pause overlay: Resume, Settings (the settings screen embedded) and Leave match, as
 * a modal dialog beside the `inert` viewport and HUD (13 §7; CD-11). Resume takes focus when the
 * pause view mounts (again on settings → pause); the settings view focuses the dialog itself. When
 * the overlay closes, focus returns to `openerRef` (stored by the pause key before it opened) if
 * that element is still in the document; switching between pause and settings never restores
 * (`usePauseOverlayFocus`). `MatchScreen` mounts it always; it shows only while the session's
 * overlay is open.
 */
export function PauseOverlay({
  openerRef,
}: {
  readonly openerRef: PauseOpenerRef;
}): ReactElement | null {
  const overlay = useAppSelector((state) => state.session.overlay);
  const titleId = useId();
  const dialogRef = usePauseOverlayFocus(overlay, openerRef);
  if (overlay === null) {
    return null;
  }
  return (
    <div className={styles.scrim}>
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={overlay === 'pause' ? titleId : undefined}
        aria-label={overlay === 'pause' ? undefined : STRINGS.pause.settings}
        tabIndex={-1}
        className={styles.dialog}
      >
        {overlay === 'settings' ? (
          <SettingsScreen isOverlay />
        ) : (
          <>
            <h2 id={titleId} className={styles.title}>
              {STRINGS.pause.title}
            </h2>
            <div className={styles.actions}>
              <Button
                autoFocus
                onClick={() => {
                  emitIntent({ kind: 'close-overlay' });
                }}
              >
                {STRINGS.pause.resume}
              </Button>
              <Button
                onClick={() => {
                  emitIntent({ kind: 'open-overlay', overlay: 'settings' });
                }}
              >
                {STRINGS.pause.settings}
              </Button>
              <Button
                onClick={() => {
                  emitIntent({ kind: 'leave-match' });
                }}
              >
                {STRINGS.pause.leave}
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
