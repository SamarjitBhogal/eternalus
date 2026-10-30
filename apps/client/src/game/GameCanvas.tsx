import { type ReactElement, useEffect, useRef } from 'react';

import styles from './GameCanvas.module.css';
import type { GameCanvasProps } from './GameCanvas.types';
import { GameCanvasChrome } from './GameCanvasChrome';
import { useExplorerChrome } from './useExplorerChrome';

/**
 * The match viewport (13 §1): owns the canvas and hands it to the session when it mounts
 * (`attach` → `SessionController.attachViewport`, which builds the match), and the returned
 * detach when it unmounts. In normal play only a "Leave cathedral" control is drawn, while inside
 * the interior (an interim, CD-22); the developer explorer's toolbar and legend show only while
 * the explorer is on (`isExplorerShown` at the start, `?dev=1`; then DEC-105's hotkey; DEC-32,
 * INBOX HC-F8). `GameCanvasChrome` draws both from this hook's state.
 */
export function GameCanvas({
  attach,
  isExplorerShown,
  labels,
  teamNames,
}: GameCanvasProps): ReactElement {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const explorer = useExplorerChrome(isExplorerShown);
  const { chrome, isInterior, overview, leaveInterior } = explorer;
  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas === null) return undefined;
    return attach({ canvas, chrome, isExplorerShown });
  }, [attach, chrome, isExplorerShown]);
  return (
    <div className={styles.explorer}>
      <canvas
        ref={canvasRef}
        className={
          explorer.isExplorerShown ? [styles.canvas, styles.isExploring].join(' ') : styles.canvas
        }
        aria-label={explorer.isExplorerShown ? labels.explorer.canvas : labels.canvas}
      />
      <GameCanvasChrome
        isExplorerShown={explorer.isExplorerShown}
        isInterior={isInterior}
        labels={labels}
        teamNames={teamNames}
        onOverview={overview}
        onLeaveInterior={leaveInterior}
      />
    </div>
  );
}
