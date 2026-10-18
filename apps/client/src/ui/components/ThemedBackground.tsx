import type { ComponentType, ReactElement } from 'react';

import type { BackgroundLayer, BackgroundSet } from '../../bridge/catalogue.types';
import { GradientLayer } from './GradientLayer';
import { ImageLayer } from './ImageLayer';
import { ParticlesLayer } from './ParticlesLayer';
import styles from './ThemedBackground.module.css';

type LayerKind = BackgroundLayer['kind'];
type LayerByKind = { readonly [K in LayerKind]: Extract<BackgroundLayer, { kind: K }> };

/** One view per layer kind (rule 12: a new kind is one entry here and one component). */
const BACKGROUND_LAYER_VIEWS: {
  readonly [K in LayerKind]: ComponentType<{ readonly layer: LayerByKind[K] }>;
} = {
  gradient: GradientLayer,
  image: ImageLayer,
  particles: ParticlesLayer,
};

/** Draws `layer` with the view of its kind (the kind and the layer correlate through `K`). */
function renderLayer<K extends LayerKind>(
  kind: K,
  layer: LayerByKind[K],
  key: number,
): ReactElement {
  const View: ComponentType<{ readonly layer: LayerByKind[K] }> = BACKGROUND_LAYER_VIEWS[kind];
  return <View key={key} layer={layer} />;
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
      {set?.layers.map((layer, index) => renderLayer(layer.kind, layer, index))}
    </div>
  );
}
