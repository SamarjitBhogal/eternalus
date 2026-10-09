import { type ReactElement, useRef } from 'react';

import styles from './GameCanvas.module.css';
import { useMatch } from './useMatch';

/** The canvas the match renders into; it owns the match for as long as it is mounted. */
export function GameCanvas(): ReactElement {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useMatch(canvasRef);

  return <canvas ref={canvasRef} className={styles.canvas} />;
}
