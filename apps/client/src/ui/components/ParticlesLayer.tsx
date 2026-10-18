import type { ReactElement } from 'react';

import type { BackgroundLayer } from '../../bridge/catalogue.types';
import { PARTICLE_STEP_DELAY, PARTICLE_STEP_X, PARTICLE_STEP_Y } from './ParticlesLayer.constants';
import styles from './ParticlesLayer.module.css';

const percent = (step: number, index: number): string =>
  `${String(Math.round(((index * step) % 1) * 1000) / 10)}%`;

/** Drifting particles in a colour token, placed deterministically (no RNG). */
export function ParticlesLayer({
  layer,
}: {
  readonly layer: Extract<BackgroundLayer, { kind: 'particles' }>;
}): ReactElement {
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
