import { type ReactElement, useEffect, useRef } from 'react';

import styles from './GameCanvas.module.css';
import type { GameCanvasProps } from './GameCanvas.types';
import { GameCanvasChrome } from './GameCanvasChrome';
import { useExplorerChrome } from './useExplorerChrome';

/**
 * The match viewport (13 §1): owns the canvas and hands it to the session when it mounts
 * (`attach` → `SessionController.attachViewport`, which builds the match), and the returned
 * detach when it unmounts. In normal play only a "Leave cathedral" control is drawn, while inside
 * the interior (an interim, DV-119); the developer explorer's toolbar and legend show only with
 * `isExplorerShown` (`?dev=1`, I-55). `GameCanvasChrome` draws both from this hook's state.
 */
export function GameCanvas({ attach, isExplorerShown, labels }: GameCanvasProps): ReactElement {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { chrome, isInterior, overview, leaveInterior } = useExplorerChrome();
  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas === null) return undefined;
    return attach({ canvas, chrome, isExplorerShown });
  }, [attach, chrome, isExplorerShown]);
  return (
    <div className={styles.explorer}>
      <canvas
        ref={canvasRef}
        className={isExplorerShown ? [styles.canvas, styles.isExploring].join(' ') : styles.canvas}
        aria-label={isExplorerShown ? labels.explorer.canvas : labels.canvas}
      />
      <GameCanvasChrome
        isExplorerShown={isExplorerShown}
        isInterior={isInterior}
        labels={labels}
        onOverview={overview}
        onLeaveInterior={leaveInterior}
      />
    </div>
  );
}
