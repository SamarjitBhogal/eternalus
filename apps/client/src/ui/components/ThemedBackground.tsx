import type { ReactElement } from 'react';

import type { BackgroundLayer, BackgroundSet } from '../../bridge/events';
import {
  PARTICLE_STEP_DELAY,
  PARTICLE_STEP_X,
  PARTICLE_STEP_Y,
} from './ThemedBackground.constants';
import styles from './ThemedBackground.module.css';

const percent = (step: number, index: number): string =>
  `${String(Math.round(((index * step) % 1) * 1000) / 10)}%`;

function Layer({ layer }: { readonly layer: BackgroundLayer }): ReactElement {
  if (layer.kind === 'gradient') {
    const stops = layer.stops.map((token) => `var(${token})`).join(', ');
    return (
      <div
        className={styles.gradient}
        style={{ backgroundImage: `linear-gradient(${String(layer.angleDeg)}deg, ${stops})` }}
      />
    );
  }
  if (layer.kind === 'image') {
    return <div className={styles.image} style={{ backgroundImage: `url("${layer.src}")` }} />;
  }
  return (
    <div className={styles.particles}>
      {Array.from({ length: layer.count }, (_, index) => (
        <span
          key={index}
          className={styles.particle}
          style={{
            left: percent(PARTICLE_STEP_X, index),
            top: percent(PARTICLE_STEP_Y, index),
            backgroundColor: `var(${layer.colourToken})`,
            animationDelay: `calc(var(--motion-ambient) * -${String((index * PARTICLE_STEP_DELAY) % 1)})`,
          }}
        />
      ))}
    </div>
  );
}

/**
 * Draws a content `BackgroundSet` (contract §2.5) full-bleed behind a screen: gradients, drifting
 * particles and images, in layer order. Decorative, so hidden from assistive technology; motion
 * stops under `prefers-reduced-motion`. Renders a plain surface until content has loaded.
 */
export function ThemedBackground({
  set,
}: {
  readonly set: BackgroundSet | undefined;
}): ReactElement {
  return (
    <div className={styles.background} aria-hidden="true" data-background={set?.id}>
      {set?.layers.map((layer, index) => (
        <Layer key={index} layer={layer} />
      ))}
    </div>
  );
}
