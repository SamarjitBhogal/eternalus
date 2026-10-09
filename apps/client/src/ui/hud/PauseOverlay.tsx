import { type ReactElement, useId } from 'react';

import { emitIntent } from '../../bridge/eventBus';
import { useAppSelector } from '../../bridge/hooks';
import { Button } from '../components/Button';
import { SettingsScreen } from '../screens/SettingsScreen';
import styles from './PauseOverlay.module.css';
import { PAUSE_STRINGS as STRINGS } from './PauseOverlay.strings';

/**
 * The in-match pause overlay: Resume, Settings (the settings screen embedded) and Leave match.
 * `MatchScreen` mounts it always; it shows only while the session's overlay is open.
 */
export function PauseOverlay(): ReactElement | null {
  const overlay = useAppSelector((state) => state.session.overlay);
  const titleId = useId();
  if (overlay === null) {
    return null;
  }
  return (
    <div className={styles.scrim}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={overlay === 'pause' ? titleId : undefined}
        aria-label={overlay === 'pause' ? undefined : STRINGS.settings}
        className={styles.dialog}
      >
        {overlay === 'settings' ? (
          <SettingsScreen isOverlay />
        ) : (
          <>
            <h2 id={titleId} className={styles.title}>
              {STRINGS.title}
            </h2>
            <div className={styles.actions}>
              <Button
                onClick={() => {
                  emitIntent({ kind: 'close-overlay' });
                }}
              >
                {STRINGS.resume}
              </Button>
              <Button
                onClick={() => {
                  emitIntent({ kind: 'open-overlay', overlay: 'settings' });
                }}
              >
                {STRINGS.settings}
              </Button>
              <Button
                onClick={() => {
                  emitIntent({ kind: 'leave-match' });
                }}
              >
                {STRINGS.leave}
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
