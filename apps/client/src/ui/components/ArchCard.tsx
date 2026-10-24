import type { CSSProperties, ReactElement } from 'react';

import type { AssetId, RenditionKey } from '../../bridge/catalogue.types';
import { ARCH_UNIT_PATH } from './archUnitPath';
import styles from './ArchCard.module.css';
import { classNames } from './classNames';
import { cssVars } from './cssVars';
import { useAssetUrl } from './useAssetUrl';

/** The layers a selection card stacks (Figma 55:267, 62:152 …), drawn bottom to top as listed. */
export type ArchLayerKind =
  | 'glass'
  | 'shadow-plate'
  | 'outer-outline'
  | 'inner-outline'
  | 'text-scrim'
  | 'art'
  | 'focus-ring';

/**
 * How the art is drawn: `cover` = a master clipped to the arch with live `under`/`over`/`stroke`
 * parts; `image` = one finished rendition at its own pixel box (I-45); `plate` = a Figma GLASS plate
 * (R1 step 2) at its own pixel box, whose two 1 px inner strokes the `inner-outline` layer draws live
 * at their own origins (OD-1).
 */
export type ArchArtMode = 'cover' | 'image' | 'plate';

/** A card box's top-left in its container's px (Figma frame px; may be fractional). */
type ArchOrigin = { readonly x: number; readonly y: number };

/** Remainders are written to 4 decimals, finer than any Figma value the boxes come from. */
const REMAINDER_DECIMALS = 4;

/** The integer root offset and the fractional remainder the vector layers carry (I-45). */
function originStyle(origin: ArchOrigin): CSSProperties {
  const left = Math.floor(origin.x);
  const top = Math.floor(origin.y);
  const remainder = (value: number, floor: number): string =>
    `${String(Number((value - floor).toFixed(REMAINDER_DECIMALS)))}px`;
  return {
    left,
    top,
    ...cssVars({ '--arch-fx': remainder(origin.x, left), '--arch-fy': remainder(origin.y, top) }),
  };
}

/** One arch-shaped vector layer: the unit path stretched to the layer box, non-scaling strokes. */
function archVector(
  layer: ArchLayerKind,
  part: 'fill' | 'stroke',
  className?: string,
): ReactElement {
  return (
    <svg
      key={layer}
      data-arch-layer={layer}
      className={classNames(styles.vector, className)}
      viewBox="0 0 1 1"
      preserveAspectRatio="none"
      overflow="visible"
    >
      <path data-arch-part={part} d={ARCH_UNIT_PATH} />
    </svg>
  );
}

/** Plate mode (OD-1): the art node's and the overlay node's 1 px strokes, each placed by its own transform. */
function plateStrokes(): ReactElement {
  return (
    <svg
      key="inner-outline"
      data-arch-layer="inner-outline"
      className={styles.strokes}
      overflow="visible"
    >
      <path data-arch-part="art-stroke" className={styles.plateStroke} d={ARCH_UNIT_PATH} />
      <path data-arch-part="overlay-stroke" className={styles.plateStroke} d={ARCH_UNIT_PATH} />
    </svg>
  );
}

/** A rendition or plate at the integer box the consumer gives the art layer (never fitted, I-45). */
const rasterArt = (url: string | null, part: 'image' | 'plate'): ReactElement => (
  <div
    key="art"
    data-arch-layer="art"
    data-arch-art={url === null ? 'missing' : part}
    className={styles.rasterArt}
  >
    {url !== null && (
      <img
        data-arch-part={part}
        className={styles.raster}
        src={url}
        alt=""
        decoding="async"
        draggable={false}
      />
    )}
  </div>
);

/** The master clipped to the arch, between its live `under` and `over` fills and its stroke. */
const coverArt = (url: string | null): ReactElement => (
  <div
    key="art"
    data-arch-layer="art"
    data-arch-art={url === null ? 'missing' : 'cover'}
    className={styles.coverArt}
  >
    <svg className={styles.part} viewBox="0 0 1 1" preserveAspectRatio="none" overflow="visible">
      <path data-arch-part="under" d={ARCH_UNIT_PATH} />
    </svg>
    {url !== null && (
      <div className={styles.clip}>
        <img
          data-arch-part="image"
          className={styles.cover}
          src={url}
          alt=""
          decoding="async"
          draggable={false}
        />
      </div>
    )}
    <svg className={styles.part} viewBox="0 0 1 1" preserveAspectRatio="none" overflow="visible">
      <path data-arch-part="over" d={ARCH_UNIT_PATH} />
    </svg>
    <svg className={styles.part} viewBox="0 0 1 1" preserveAspectRatio="none" overflow="visible">
      <path data-arch-part="stroke" d={ARCH_UNIT_PATH} />
    </svg>
  </div>
);

/** The art layer per mode; `data-arch-art="missing"` until (or unless) the art has a URL. */
const ART_VIEWS: Readonly<Record<ArchArtMode, (url: string | null) => ReactElement>> = {
  cover: coverArt,
  image: (url) => rasterArt(url, 'image'),
  plate: (url) => rasterArt(url, 'plate'),
};

/** The inner outline per mode: one stroke at the overlay box, or both 1 px strokes over a plate. */
const INNER_OUTLINE_VIEWS: Readonly<Record<ArchArtMode, () => ReactElement>> = {
  cover: () => archVector('inner-outline', 'stroke'),
  image: () => archVector('inner-outline', 'stroke'),
  plate: plateStrokes,
};

const LAYER_VIEWS: Readonly<
  Record<ArchLayerKind, (mode: ArchArtMode, artUrl: string | null) => ReactElement>
> = {
  glass: () => <div key="glass" data-arch-layer="glass" className={styles.glass} />,
  'shadow-plate': () => archVector('shadow-plate', 'fill'),
  'outer-outline': () => archVector('outer-outline', 'stroke'),
  'inner-outline': (mode) => INNER_OUTLINE_VIEWS[mode](),
  'text-scrim': () => <div key="text-scrim" data-arch-layer="text-scrim" className={styles.box} />,
  art: (mode, artUrl) => ART_VIEWS[mode](artUrl),
  'focus-ring': () => archVector('focus-ring', 'stroke', styles.focusRing),
};

/**
 * A pointed-arch card, drawn as the stack of layers its consumer names (bottom → top), all
 * `aria-hidden`; the consumer's control (a `button role="radio"`) carries the name and state.
 *
 * Styling contract (DV-60): every layer is an absolutely positioned element with
 * `data-arch-layer="<kind>"`; arch shapes are `<svg viewBox="0 0 1 1">` with the unit arch, whose
 * paths carry `data-arch-part` (`fill`, `stroke`; art parts `under`, `image`, `over`, `stroke`;
 * rasters `image` or `plate`; plate strokes `art-stroke`, `overlay-stroke`). This module only
 * makes paths unfilled and strokes non-scaling; the consumer's module sets each layer's box and
 * treatment through those attributes. In plate mode the `inner-outline` svg is placed at an
 * integer box and each stroke path takes its node's `transform: translate(x, y) scale(w, h)`.
 *
 * With `origin`, the root sits at its integer floor and the fractional remainder goes to the
 * vector layers (and the live cover art) as `--arch-fx`/`--arch-fy`; a rendition or plate keeps
 * its integer box and is never moved by a fraction (I-45).
 */
export function ArchCard({
  layers,
  artAssetId,
  artMode = 'cover',
  artRendition,
  origin,
}: {
  readonly layers: readonly ArchLayerKind[];
  readonly artAssetId: AssetId | null;
  readonly artMode?: ArchArtMode | undefined;
  /** The rendition an `image`-mode art is drawn from (its exact device-pixel box, I-45). */
  readonly artRendition?: RenditionKey | undefined;
  readonly origin?: ArchOrigin | undefined;
}): ReactElement {
  const artUrl = useAssetUrl(artAssetId, artRendition);
  return (
    <div
      className={styles.card}
      aria-hidden="true"
      style={origin === undefined ? undefined : originStyle(origin)}
    >
      {layers.map((layer) => LAYER_VIEWS[layer](artMode, artUrl))}
    </div>
  );
}
