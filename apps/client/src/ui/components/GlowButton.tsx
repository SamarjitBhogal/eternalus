import { useId, type ReactElement } from 'react';

import type { AssetId } from '../../bridge/catalogue.types';
import { classNames } from './classNames';
import { BRACE_MIRRORED_UNIT_PATH, BRACE_UNIT_PATH } from './GlowButton.constants';
import styles from './GlowButton.module.css';
import { useGlowButtonChrome } from './useGlowButtonChrome';

/** The two glow buttons: Select Class (62:222) and LOCK IN (58:277). */
export type GlowButtonSkin = 'select-class' | 'lock-in';

const SKIN_CLASSES: Readonly<Record<GlowButtonSkin, string | undefined>> = {
  'select-class': styles.selectClass,
  'lock-in': styles.lockIn,
};

const brace = (side: 'left' | 'right', path: string): ReactElement => (
  <svg
    className={styles.brace}
    data-side={side}
    viewBox="0 0 1 1"
    preserveAspectRatio="none"
    overflow="visible"
    aria-hidden="true"
  >
    <path d={path} />
  </svg>
);

/** Both braces in the braces group's box (62:225 / 58:278). */
const braces = (className: string | undefined): ReactElement => (
  <span className={className}>
    {brace('left', BRACE_UNIT_PATH)}
    {brace('right', BRACE_MIRRORED_UNIT_PATH)}
  </span>
);

/**
 * A selection screen's main action: Select Class or LOCK IN. Placed by its skin at its Figma
 * node in the 1920 × 1080 artboard (render it in a full-artboard container).
 *
 * Two effects paths (I-36, I-80): with a `chromeAssetId` whose plate is loaded and boxed, and
 * while enabled and neither hovered nor pressed, Figma's own chrome plate is drawn at its full
 * render-bounds box; otherwise the live chrome: a backdrop-blur pane beneath (never under a
 * filter, the backdrop-root rule), then the glow group: its shadow (σ = r/2, knocked out as Figma
 * draws it) cast from a plain copy of the ring, haze and brace strokes, and above it, unfiltered,
 * the ring, haze and braces with their glows, the braces' azure glows again cast from plain stroke
 * copies (Figma casts a group's shadow from its children's geometry, not from their glows). The
 * label and its six sky glows (`sel-glow-label`) are always live, above the chrome and
 * outside the group filter (a CSS filter would also shadow the label's glows, which Figma does not
 * show: measured on 58:271). Disabled, it stays
 * focusable with `aria-disabled` and announces `disabledHint`; a press then does nothing.
 */
export function GlowButton({
  label,
  onPress,
  skin,
  isDisabled = false,
  disabledHint,
  chromeAssetId,
}: {
  readonly label: string;
  readonly onPress: () => void;
  readonly skin: GlowButtonSkin;
  readonly isDisabled?: boolean | undefined;
  /** Announced (aria-describedby) while disabled. */
  readonly disabledHint?: string | undefined;
  /** The Figma-state chrome plate; `null` = live CSS (no plate in the catalogue, `'css'`, or a pick it was not exported with). */
  readonly chromeAssetId: AssetId | null;
}): ReactElement {
  const hintId = useId();
  const { plate, ...pointerHandlers } = useGlowButtonChrome(chromeAssetId, isDisabled);
  const hasHint = isDisabled && disabledHint !== undefined;
  return (
    <>
      <button
        type="button"
        className={classNames(styles.button, SKIN_CLASSES[skin])}
        aria-disabled={isDisabled ? true : undefined}
        aria-describedby={hasHint ? hintId : undefined}
        onClick={() => {
          if (!isDisabled) onPress();
        }}
        {...pointerHandlers}
      >
        {plate === null ? (
          <>
            <span className={styles.pane} aria-hidden="true" />
            <span className={styles.glowGroup} aria-hidden="true">
              <span className={styles.lit}>
                <span className={styles.ring} />
                <span className={styles.haze} />
                {braces(styles.braces)}
              </span>
              <span className={styles.ring} />
              <span className={styles.haze} />
              {braces(classNames(styles.braces, styles.bracesGlow))}
              {braces(styles.braces)}
            </span>
          </>
        ) : (
          <img
            className={styles.chrome}
            src={plate.url}
            style={plate.box}
            alt=""
            aria-hidden="true"
            decoding="async"
            draggable={false}
          />
        )}
        <span className={styles.label}>{label}</span>
      </button>
      {/* Outside the button: a description, never part of its name. */}
      {hasHint && (
        <span id={hintId} className={styles.srOnly}>
          {disabledHint}
        </span>
      )}
    </>
  );
}
