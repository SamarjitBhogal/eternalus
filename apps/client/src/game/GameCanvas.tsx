import { type ReactElement, useRef } from 'react';
import styles from './GameCanvas.module.css';
import { useMapCanvas } from './useMapCanvas';

/** The explorable battlefield preview and its presentation-only navigation controls. */
export function GameCanvas(): ReactElement {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { isInterior, overview } = useMapCanvas(canvasRef);
  return (
    <section className={styles.explorer} aria-label="Eternalus map explorer">
      <canvas
        ref={canvasRef}
        className={styles.canvas}
        aria-label="Drag to explore, scroll to zoom, click the cathedral to enter"
      />
      <div className={styles.toolbar}>
        <span>
          Drag to explore <b>·</b> Scroll to zoom <b>·</b>{' '}
          {isInterior ? 'Explore the sanctuary' : 'Click cathedral to enter'}
        </span>
        <button type="button" onClick={overview}>
          {isInterior ? 'Leave cathedral' : 'World overview'}
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
