import { type ReactElement, useId } from 'react';

import { emitIntent } from '../../bridge/eventBus';
import { useAppSelector } from '../../bridge/hooks';
import { Button } from '../components/Button';
import { useModalKeyFilter } from '../components/useModalKeyFilter';
import { STRINGS } from '../strings';
import styles from './DuelLeaveDialog.module.css';

const { duelLeave: text } = STRINGS;

/**
 * The confirmation over an online Duel (the `pause-menu` key opens it): leaving forfeits the match
 * and the opponent wins, and the match does not pause (the server runs it). Stay, focused by
 * default, closes it; Leave forfeits and returns to the main menu. `MatchScreen` mounts it always;
 * it shows only while the `leave-duel` overlay is open, and then only Escape works (the player's
 * Legend stands still: `useModalKeyFilter`). The focus return to the opener is
 * `PauseOverlay`'s (`usePauseOverlayFocus`).
 */
export function DuelLeaveDialog(): ReactElement | null {
  const overlay = useAppSelector((state) => state.session.overlay);
  const titleId = useId();
  const textId = useId();
  const isOpen = overlay === 'leave-duel';
  useModalKeyFilter(isOpen, () => {
    emitIntent({ kind: 'close-overlay' });
  });
  if (!isOpen) return null;
  return (
    <div className={styles.scrim}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={textId}
        className={styles.dialog}
      >
        <h2 id={titleId} className={styles.title}>
          {text.title}
        </h2>
        <p id={textId} className={styles.text}>
          {text.text}
        </p>
        <div className={styles.actions}>
          <Button
            autoFocus
            onClick={() => {
              emitIntent({ kind: 'close-overlay' });
            }}
          >
            {text.stay}
          </Button>
          <Button
            onClick={() => {
              emitIntent({ kind: 'forfeit-duel' });
            }}
          >
            {text.leave}
          </Button>
        </div>
      </div>
    </div>
  );
}
