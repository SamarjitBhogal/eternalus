import type { AssetManifestEntry } from './AssetManifest.types';
import { ASSASSIN_REFERENCE_ASSET } from './assassinReferenceAsset';
import { KNIGHT_REFERENCE_ASSET } from './knightReferenceAsset';
import { PALADIN_REFERENCE_ASSET } from './paladinReferenceAsset';
import { COLOSSUS_REFERENCE_ASSET } from './colossusReferenceAsset';
import { JUGGERNAUT_REFERENCE_ASSET } from './juggernautReferenceAsset';
/** Selection references and all native-size renditions, registered once. */
export const LEGEND_REFERENCE_ASSETS: readonly AssetManifestEntry[] = [
  ASSASSIN_REFERENCE_ASSET,
  KNIGHT_REFERENCE_ASSET,
  PALADIN_REFERENCE_ASSET,
  COLOSSUS_REFERENCE_ASSET,
  JUGGERNAUT_REFERENCE_ASSET,
];
