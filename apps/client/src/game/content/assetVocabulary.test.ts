import { describe, expect, expectTypeOf, it } from 'vitest';

import type {
  AssetId as BridgeAssetId,
  RasterBox as BridgeRasterBox,
  RenditionKey as BridgeRenditionKey,
} from '../../bridge/catalogue.types';
import type { AssetGroup as BridgeAssetGroup } from '../../bridge/events';
import { ASSET_MANIFEST } from '../../data/resources/AssetManifest';
import type {
  AssetGroup,
  AssetId,
  RasterBox,
  RenditionKey,
} from '../../data/resources/AssetManifest.types';

/** Every bridge rendition key; a key missing here fails the `expectTypeOf` case below. */
const BRIDGE_RENDITION_KEYS = [
  'ally-tile',
  'player-tile',
  'player-tile-picked',
  'legend-mini',
  'detail-class',
  'detail-class-alt',
  'detail-legend',
  'card-idle',
  'card-picked',
  'refraction-idle',
  'refraction-picked',
  'mirrored',
] as const satisfies readonly BridgeRenditionKey[];

// bridge/ and data/ never import each other, so each states the asset vocabulary; game/ sees both.
describe('asset vocabulary', () => {
  it('is the same in bridge/ and data/resources/, and the manifest uses only bridge renditions', () => {
    expectTypeOf<BridgeAssetGroup>().toEqualTypeOf<AssetGroup>();
    expectTypeOf<BridgeRenditionKey>().toEqualTypeOf<RenditionKey>();
    expectTypeOf<BridgeAssetId>().toEqualTypeOf<AssetId>();
    expectTypeOf<BridgeRasterBox>().toEqualTypeOf<RasterBox>();
    expectTypeOf<(typeof BRIDGE_RENDITION_KEYS)[number]>().toEqualTypeOf<BridgeRenditionKey>();
    const shipped = ASSET_MANIFEST.assets.flatMap((entry) =>
      entry.type === 'ui-image' ? Object.keys(entry.renditions ?? {}) : [],
    );
    expect(shipped.length).toBeGreaterThan(0);
    expect(
      shipped.filter((key) => !(BRIDGE_RENDITION_KEYS as readonly string[]).includes(key)),
    ).toEqual([]);
  });
});
