import type { ClassSelectLayout, EffectsRenderer } from '../../bridge/catalogue.types';
import type { AssetGroup } from '../../bridge/events';

/** The extra asset group each class-step layout needs (I-47). */
const CLASS_STEP_ASSET_GROUPS: Readonly<Record<ClassSelectLayout, AssetGroup>> = {
  primary: 'selection-primary',
  alternate: 'selection-alternate',
};

/** The plate groups each effects renderer needs per layout (I-80): only the raster path loads plates. */
const EFFECT_ASSET_GROUPS: Readonly<
  Record<EffectsRenderer, Readonly<Record<ClassSelectLayout, readonly AssetGroup[]>>>
> = {
  'figma-raster': {
    primary: ['selection-raster', 'selection-primary-raster'],
    alternate: ['selection-raster'],
  },
  css: { primary: [], alternate: [] },
};

/**
 * The groups a session loads for character select (`LoadingState`, I-86): `selection`, the
 * layout's group, then the renderer's plates.
 */
export function selectionAssetGroups(
  layout: ClassSelectLayout,
  renderer: EffectsRenderer,
): readonly AssetGroup[] {
  return ['selection', CLASS_STEP_ASSET_GROUPS[layout], ...EFFECT_ASSET_GROUPS[renderer][layout]];
}

/**
 * Every selection group once, in release order (`MatchState.enter`): `selection`, the layout
 * groups, then the plate groups. Releasing a group that was never loaded is a no-op.
 */
export const SELECTION_ASSET_GROUPS: readonly AssetGroup[] = [
  ...new Set<AssetGroup>([
    'selection',
    ...Object.values(CLASS_STEP_ASSET_GROUPS),
    ...Object.values(EFFECT_ASSET_GROUPS).flatMap((byLayout) => Object.values(byLayout).flat()),
  ]),
];
