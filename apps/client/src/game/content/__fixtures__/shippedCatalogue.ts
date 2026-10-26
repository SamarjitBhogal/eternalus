/**
 * Test support: the shipped catalogue as `main.tsx` builds it, its asset ids checked against
 * `ASSET_MANIFEST`. Imported only by tests and the visual harness, never by a module `main.tsx`
 * reaches (the composition root passes the manifest's ids itself).
 */
import { loadDisplayContent } from '@eternalus/core';

import { isSelectableSpec } from '../../../bridge/selectionRules';
import { ASSET_MANIFEST } from '../../../data/resources/AssetManifest';
import type { CatalogueSource } from '../CatalogueSource.types';
import type { DisplayOverrides } from '../CataloguePresentation.types';
import { createCoreCatalogue, NO_DISPLAY_OVERRIDES } from '../coreCatalogue';

/** The shipped catalogue with `overrides` (none by default). */
export function shippedCatalogue(
  overrides: DisplayOverrides = NO_DISPLAY_OVERRIDES,
): CatalogueSource {
  return createCoreCatalogue({
    knownAssetIds: new Set(ASSET_MANIFEST.assets.map((entry) => entry.id)),
    overrides,
  });
}

/**
 * The first selectable Legend of `classId` in the shipped catalogue: a test that needs a real pick
 * names the class and takes the Legend from here, so a renamed Legend id needs no test edit.
 *
 * @throws Error when the shipped catalogue offers no selectable Legend for `classId`.
 */
export function firstAvailableSpecId(classId: string): string {
  const card = shippedCatalogue()
    .load()
    .legendClasses.find((candidate) => candidate.classId === classId);
  const spec = card?.specs.find(isSelectableSpec);
  if (spec === undefined) throw new Error(`no selectable Legend for class "${classId}"`);
  return spec.specId;
}

/** Titles the roster no longer uses (DEC-49: the Figma's "Cantor", the earlier "Gravecaller"). */
const RETIRED_NAMES = ['cantor', 'gravecaller'];

/**
 * Every name no asset id or colour token may contain (DEC-49, OA3: art is keyed by content id),
 * read from the shipped content: each class, locked-class and Legend `displayName`, both sides of
 * each `legendName`, plus the retired titles. Lower case, spaces as hyphens. A name that is also a
 * content id or a team id (`oracle`, `light`) is left out, because ids may name art.
 */
export function rosterNamesThatAreNotIds(): readonly string[] {
  const content = loadDisplayContent();
  const ids = new Set([
    ...[...content.legends, ...content.specs, ...content.lockedClasses].map(({ id }) => id),
    ...Object.keys(content.teamNames),
  ]);
  const names = [
    ...[...content.legends, ...content.lockedClasses].map(({ displayName }) => displayName),
    ...content.specs.flatMap(({ displayName, legendName }) =>
      legendName === null ? [displayName] : [displayName, legendName.light, legendName.dark],
    ),
  ].map((name) => name.toLowerCase().replace(/\s+/g, '-'));
  return [...new Set([...names.filter((name) => !ids.has(name)), ...RETIRED_NAMES])];
}
