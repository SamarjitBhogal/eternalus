import { type ReactElement, useEffect, useRef } from 'react';

import type { ColourToken, DetailRow } from '../../bridge/catalogue.types';
import { INFO_PANEL_TITLE_FIT } from './InfoPanel.constants';
import styles from './InfoPanel.module.css';
import type { InfoPanelLayout } from './InfoPanel.types';
import { InfoPanelDetails } from './InfoPanelDetails';
import { stageFontSize } from './stageScale';
import { useFitFontSize } from './useFitFontSize';

/** `InfoPanel`'s mount focus as an effect body: the title takes the focus when asked to. */
export function focusTitleIfAsked(
  shouldFocusTitle: boolean,
  title: { focus(): void } | null,
): void {
  if (shouldFocusTitle) title?.focus();
}

/**
 * The left information panel of a selection step (72:746, 62:79, 56:32): the class or Legend
 * title (`<h3>`), its role line in the content's accent and its description (each omitted when
 * `null`), then the details (`InfoPanelDetails`). Placed by its layout at the Figma panel origin,
 * every part in that layout's Figma px. `titleLive="polite"` announces a title change made without
 * a focus change (the alternate layout's previous/next); by default nothing is live. A
 * title wider than the layout's panel region is scaled down to fit (`INFO_PANEL_TITLE_FIT`).
 * `shouldFocusTitle` makes the title focusable from script and focuses it when the panel mounts
 * (the locked view, where the LOCK IN that had the focus is gone, DEC-60).
 */
export function InfoPanel({
  id,
  layout,
  title,
  subtitle,
  subtitleAccentToken,
  description,
  detailsHeader,
  rows,
  titleLive = 'off',
  shouldFocusTitle = false,
}: {
  readonly id?: string | undefined;
  readonly layout: InfoPanelLayout;
  readonly title: string;
  readonly subtitle: string | null;
  readonly subtitleAccentToken: ColourToken;
  readonly description: string | null;
  readonly detailsHeader: string;
  readonly rows: readonly DetailRow[];
  readonly titleLive?: 'off' | 'polite' | undefined;
  readonly shouldFocusTitle?: boolean;
}): ReactElement {
  const titleRef = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    focusTitleIfAsked(shouldFocusTitle, titleRef.current);
  }, [shouldFocusTitle]);
  const { maxWidth, ...sizes } = INFO_PANEL_TITLE_FIT;
  const titleSize = useFitFontSize(titleRef, title, { ...sizes, maxWidth: maxWidth[layout] });
  return (
    <div id={id} className={styles.panel} data-layout={layout}>
      <h3
        ref={titleRef}
        className={styles.title}
        style={titleSize === null ? undefined : { fontSize: stageFontSize(titleSize) }}
        aria-live={titleLive === 'polite' ? 'polite' : undefined}
        tabIndex={shouldFocusTitle ? -1 : undefined}
      >
        {title}
      </h3>
      {subtitle !== null && (
        <p className={styles.subtitle} style={{ color: `var(${subtitleAccentToken})` }}>
          {subtitle}
        </p>
      )}
      {description !== null && <p className={styles.description}>{description}</p>}
      <InfoPanelDetails layout={layout} header={detailsHeader} rows={rows} />
    </div>
  );
}
