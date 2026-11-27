import { type ReactElement, useEffect, useRef } from 'react';

import styles from './GameCanvas.module.css';
import type { GameCanvasProps } from './GameCanvas.types';
import { GameCanvasChrome } from './GameCanvasChrome';
import { useExplorerChrome } from './useExplorerChrome';

/**
 * The match viewport (13 §1): owns the canvas and hands it to the session when it mounts
 * (`attach` → `SessionController.attachViewport`, which builds the match), and the returned
 * detach when it unmounts. A canvas-aligned layer hosts CSS Sovereign art. The developer
 * explorer's toolbar and legend show only while the explorer is on (`isExplorerShown` at the
 * start, `?dev=1`; then DEC-105's hotkey; DEC-32, INBOX HC-F8). `GameCanvasChrome` draws them from
 * this hook's state.
 */
export function GameCanvas({
  attach,
  isExplorerShown,
  labels,
  teamNames,
}: GameCanvasProps): ReactElement {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sovereignLayerRef = useRef<HTMLDivElement>(null);
  const explorer = useExplorerChrome(isExplorerShown);
  const { chrome, hasDeveloperRoofs, overview } = explorer;
  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas === null) return undefined;
    const sovereignLayer = sovereignLayerRef.current;
    return attach({
      canvas,
      chrome,
      isExplorerShown,
      ...(sovereignLayer === null ? {} : { sovereignLayer }),
    });
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
      <div ref={sovereignLayerRef} className={styles.sovereignLayer} aria-hidden="true" />
      <GameCanvasChrome
        isExplorerShown={explorer.isExplorerShown}
        hasDeveloperRoofs={hasDeveloperRoofs}
        labels={labels}
        teamNames={teamNames}
        onOverview={overview}
      />
    </div>
  );
}
