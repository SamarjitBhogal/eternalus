import { type ReactElement, useRef } from 'react';

import styles from './GameCanvas.module.css';
import { useMatch } from './useMatch';

/**
 * The canvas the match renders into, with the map's navigation controls and legend. It owns the
 * match for as long as it is mounted.
 */
export function GameCanvas(): ReactElement {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { hasOpenRoofs, overview } = useMatch(canvasRef);
  return (
    <section className={styles.explorer} aria-label="Eternalus map explorer">
      <canvas
        ref={canvasRef}
        className={styles.canvas}
        aria-label="Drag to explore, scroll to zoom, click a building to toggle its roof"
      />
      <div className={styles.toolbar}>
        <span>
          Drag to explore <b>Â·</b> Scroll to zoom <b>Â·</b> Click a building to toggle its roof
        </span>
        <button type="button" onClick={overview}>
          {hasOpenRoofs ? 'Restore roofs & overview' : 'World overview'}
        </button>
      </div>
      <div className={styles.legend}>
        <span>
          <i className={styles.light} />
          Light stronghold
        </span>
        <span>
          <i className={styles.dark} />
          Dark stronghold
        </span>
        <span>
          <i className={styles.camp} />
          Neutral camps
        </span>
      </div>
    </section>
  );
}
