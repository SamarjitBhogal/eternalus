import { type ReactElement, useId } from 'react';

import { useAppSelector } from '../../bridge/hooks';
import { hudSlice } from '../../bridge/slices/hudSlice';
import { classNames } from '../components/classNames';
import { STRINGS } from '../strings';
import { FIGMA_PIP_COUNT, PIP_GEOMETRY } from './ChargePips.constants';
import styles from './ChargePips.module.css';
import { meterAttributes } from './hudMeter';

const { size, pitch, fillInset, fillSize, stroke, edgeStepsPerPx } = PIP_GEOMETRY;

/** A box edge moved onto the grid the Figma render draws it on (`edgeStepsPerPx`). */
const renderedEdge = (y: number): number => Math.round(y * edgeStepsPerPx) / edgeStepsPerPx;

/**
 * The ultimate's charge boxes (Figma 62:250), filled from the bottom up: SVG geometry so the
 * 23.861 px boxes at their fractional pitch keep the Figma's edges (FID-08), each box's stroke on
 * the 1/8 px edges the Figma render shows (`PIP_GEOMETRY.edgeStepsPerPx`). The count comes from
 * the data (`ultimatePips.total`), the Figma's three while unknown; unknown is the hatch and an
 * image "No data yet" (I-87). No rule defines the pips yet (OQ-64), so a live match shows that.
 */
export function ChargePips({
  className,
}: {
  readonly className?: string | undefined;
}): ReactElement {
  const pips = useAppSelector(hudSlice.selectors.selectUltimatePips);
  const hatchId = useId();
  const count = pips?.total ?? FIGMA_PIP_COUNT;
  const height = (count - 1) * pitch + size;
  const meter = pips === null ? null : { now: pips.filled, max: pips.total };
  return (
    <div
      className={classNames(styles.pips, className)}
      {...meterAttributes(STRINGS.hud.ultimatePips, meter)}
    >
      <svg
        className={styles.svg}
        viewBox={`0 0 ${String(Math.ceil(size))} ${String(height)}`}
        aria-hidden="true"
        focusable="false"
      >
        {pips === null && (
          <defs>
            <pattern
              id={hatchId}
              width="5"
              height="5"
              patternUnits="userSpaceOnUse"
              patternTransform="rotate(45)"
            >
              <rect className={styles.hatch} width="2" height="5" />
            </pattern>
          </defs>
        )}
        {Array.from({ length: count }, (_, index) => {
          const top = index * pitch;
          const edgeTop = renderedEdge(top);
          const edgeBottom = renderedEdge(top + size);
          // Box `count - index` counted from the bottom (the Figma fills bottom-up).
          const isFilled = pips !== null && count - index <= pips.filled;
          return (
            <g key={index}>
              {(isFilled || pips === null) && (
                <rect
                  className={isFilled ? styles.fill : undefined}
                  x={fillInset}
                  y={top + fillInset}
                  width={fillSize}
                  height={fillSize}
                  fill={pips === null ? `url(#${hatchId})` : undefined}
                />
              )}
              <rect
                className={styles.box}
                x={stroke / 2}
                y={edgeTop + stroke / 2}
                width={size - stroke}
                height={edgeBottom - edgeTop - stroke}
                strokeWidth={stroke}
              />
            </g>
          );
        })}
      </svg>
    </div>
  );
}
