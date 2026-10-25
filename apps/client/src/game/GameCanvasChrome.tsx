import type { ReactElement } from 'react';

import styles from './GameCanvas.module.css';
import type { GameCanvasLabels } from './GameCanvas.types';

/**
 * What `GameCanvas` draws over its canvas, from the chrome state `useExplorerChrome` holds: with
 * `isExplorerShown` (`?dev=1`; DEC-32, INBOX HC-F8) the developer toolbar and legend; in normal
 * play only the interim "Leave cathedral" control, while inside the interior (CD-22). It holds no
 * state, so its test renders every state on the server. Its rules are the viewport's one sheet,
 * `GameCanvas.module.css` (the developer chrome's look is unchanged, OD-14).
 */
export function GameCanvasChrome({
  isExplorerShown,
  isInterior,
  labels,
  onOverview,
  onLeaveInterior,
}: {
  readonly isExplorerShown: boolean;
  readonly isInterior: boolean;
  readonly labels: GameCanvasLabels;
  readonly onOverview: () => void;
  readonly onLeaveInterior: () => void;
}): ReactElement | null {
  if (isExplorerShown) {
    return (
      <>
        <div className={styles.toolbar}>
          <span>{isInterior ? labels.explorer.interiorHint : labels.explorer.worldHint}</span>
          <button type="button" onClick={onOverview}>
            {labels.explorer.overview}
          </button>
        </div>
        <div className={styles.legend}>
          <span>
            <i className={styles.light} />
            {labels.explorer.legend.light}
          </span>
          <span>
            <i className={styles.dark} />
            {labels.explorer.legend.dark}
          </span>
          <span>
            <i className={styles.camp} />
            {labels.explorer.legend.camps}
          </span>
        </div>
      </>
    );
  }
  if (!isInterior) return null;
  return (
    <button type="button" className={styles.leaveInterior} onClick={onLeaveInterior}>
      {labels.leaveCathedral}
    </button>
  );
}
