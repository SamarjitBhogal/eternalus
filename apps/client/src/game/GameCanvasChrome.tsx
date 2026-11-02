import type { ReactElement } from 'react';

import styles from './GameCanvasChrome.module.css';
import type { GameCanvasLabels, GameCanvasProps } from './GameCanvas.types';

/**
 * What `GameCanvas` draws over its canvas, from the chrome state `useExplorerChrome` holds: with
 * `isExplorerShown` (`?dev=1`; DEC-32, INBOX HC-F8) the developer toolbar and legend, nothing in
 * normal play (DEC-143). The toolbar's button shows the world overview, and while the developer
 * has cut a roof away (`hasOpenRoofs`) says that it also puts those roofs back. The legend names
 * each team's stronghold from `teamNames` (content). It holds no state, so its test renders every
 * state on the server. Its rules are its own sheet, `GameCanvasChrome.module.css` (the developer
 * chrome's look is unchanged, OD-14).
 */
export function GameCanvasChrome({
  isExplorerShown,
  hasOpenRoofs,
  labels,
  teamNames,
  onOverview,
}: {
  readonly isExplorerShown: boolean;
  readonly hasOpenRoofs: boolean;
  readonly labels: GameCanvasLabels;
  readonly teamNames: GameCanvasProps['teamNames'];
  readonly onOverview: () => void;
}): ReactElement | null {
  if (!isExplorerShown) return null;
  return (
    <>
      <div className={styles.toolbar}>
        <span>{labels.explorer.hint}</span>
        <button type="button" onClick={onOverview}>
          {hasOpenRoofs ? labels.explorer.restoreRoofs : labels.explorer.overview}
        </button>
      </div>
      <div className={styles.legend}>
        <span>
          <i className={styles.light} />
          {labels.explorer.legend.stronghold(teamNames.light)}
        </span>
        <span>
          <i className={styles.dark} />
          {labels.explorer.legend.stronghold(teamNames.dark)}
        </span>
        <span>
          <i className={styles.camp} />
          {labels.explorer.legend.camps}
        </span>
      </div>
    </>
  );
}
