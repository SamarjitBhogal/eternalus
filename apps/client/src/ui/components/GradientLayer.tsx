import type { ReactElement } from 'react';

import type { BackgroundLayer } from '../../bridge/catalogue.types';
import styles from './GradientLayer.module.css';

/** A slowly panning linear gradient whose stops are colour tokens (never literals). */
export function GradientLayer({
  layer,
}: {
  readonly layer: Extract<BackgroundLayer, { kind: 'gradient' }>;
}): ReactElement {
  const stops = layer.stops.map((token) => `var(${token})`).join(', ');
  return (
    <div
      className={styles.gradient}
      style={{ backgroundImage: `linear-gradient(${String(layer.angleDeg)}deg, ${stops})` }}
    />
  );
}
