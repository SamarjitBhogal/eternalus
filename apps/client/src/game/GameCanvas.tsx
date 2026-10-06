import { type ReactElement, useRef } from 'react';

import styles from './GameCanvas.module.css';
import { useMapCanvas } from './useMapCanvas';

/** The canvas the game will render into. */
export function GameCanvas(): ReactElement {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useMapCanvas(canvasRef);

  return <canvas ref={canvasRef} className={styles.canvas} />;
}
