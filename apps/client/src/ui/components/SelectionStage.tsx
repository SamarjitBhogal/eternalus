import type { CSSProperties, ReactElement, ReactNode } from 'react';

import { cssVars } from './cssVars';
import styles from './SelectionStage.module.css';
import { useStageScale } from './useStageScale';

/** The frame edges a selection step darkens: 62:125 and 62:70 both, 58:271 only the bottom. */
export type VignetteEdge = 'top' | 'bottom';

const VIGNETTE_CLASSES: Readonly<Record<VignetteEdge, string | undefined>> = {
  top: styles.vignetteTop,
  bottom: styles.vignetteBottom,
};

/** `--stage-scale` for the CD-23 text floor, and the fit transform only when it is not identity. */
function artboardStyle(scale: number): CSSProperties {
  const scaleVar = cssVars({ '--stage-scale': String(scale) });
  return scale === 1 ? scaleVar : { ...scaleVar, transform: `scale(${String(scale)})` };
}

/**
 * The 1920 × 1080 artboard of the selection screens (13 §10), centred in its host and scaled to fit
 * the window (`useStageScale`), with the step's vignettes beneath its children. Every selection
 * module is written in Figma px of this artboard; at 1920 × 1080 the scale is identity and no
 * transform is set, so rasters land 1:1 (I-45). It isolates its own stacking context: the
 * vignettes' negative z-indexes (top −3, bottom −1) stay above the backdrop and below the step,
 * and exposes `--stage-scale` so text floors at `--text-min` on screen below 1080p (CD-23).
 */
export function SelectionStage({
  vignettes,
  children,
}: {
  readonly vignettes: readonly VignetteEdge[];
  readonly children: ReactNode;
}): ReactElement {
  const scale = useStageScale();
  return (
    <div className={styles.artboard} style={artboardStyle(scale)}>
      {vignettes.map((edge) => (
        <div
          key={edge}
          className={VIGNETTE_CLASSES[edge]}
          data-vignette={edge}
          aria-hidden="true"
        />
      ))}
      {children}
    </div>
  );
}
