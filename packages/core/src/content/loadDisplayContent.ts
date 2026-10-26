import type { PlayableTeam } from '../teams/teams.types';
import type { ContentCatalogue } from './ContentCatalogue';
import {
  createDefaultContentRules,
  createLegendSpecRules,
  createLockedClassRules,
} from './defaultContentRules';
import { LEGEND_CLASSES } from './legends/legendCatalogue';
import type { LegendDefinition } from './legends/legends.types';
import { LOCKED_CLASSES } from './legends/locked/lockedClassCatalogue';
import type { LockedClassDefinition } from './legends/locked/lockedClasses.types';
import { LEGEND_SPECS } from './legends/specs/legendSpecCatalogue';
import type { LegendSpecDefinition } from './legends/specs/legendSpecs.types';
import { MAP_FEATURE_DEFINITIONS } from './maps/mapFeatureDefinitions';
import type { MapFeatureKind } from './maps/maps.types';
import { PROFILE_DISPLAY_NAME } from './profile/profileDisplayName';
import { TEAM_DISPLAY_NAMES } from './teams/teamDisplayNames';
import { ContentValidator } from './validation/ContentValidator';

/** Display data the client's selection screens and HUD show (read-only definitions). */
export type DisplayContent = {
  readonly legends: readonly LegendDefinition[];
  readonly specs: readonly LegendSpecDefinition[];
  /** Shown after the playable classes as locked cards, never selectable (DEC-48). */
  readonly lockedClasses: readonly LockedClassDefinition[];
  readonly mapFeatures: readonly {
    readonly id: string;
    readonly kind: MapFeatureKind;
    readonly displayName: string | null;
  }[];
  /** Each playable team's display name (the team badge and the roster labels). */
  readonly teamNames: Readonly<Record<PlayableTeam, string>>;
  /** The profile screen's display name (the main menu item and the screen's title). */
  readonly profileDisplayName: string;
};

/** The catalogues `loadDisplayContent` validates and returns; each defaults to the shipped one. */
type DisplayCatalogues = {
  readonly legends?: ContentCatalogue<LegendDefinition>;
  readonly specs?: ContentCatalogue<LegendSpecDefinition>;
  readonly lockedClasses?: ContentCatalogue<LockedClassDefinition>;
};

/**
 * Loads the display content and validates it once: the legends with `createDefaultContentRules()`,
 * then the specs with `createLegendSpecRules(legends)`, then the locked classes with
 * `createLockedClassRules()`, each through a `ContentValidator` (04 §5, DEC-22). The display
 * sibling of `loadDefaultContent` (02 §6).
 *
 * @param catalogues - The catalogues to load; each one left out is the shipped one.
 * @throws ContentValidationError listing every broken rule of the first catalogue that fails (each
 *   catalogue reports all its own problems at once; a catalogue is not checked while one before it
 *   fails).
 */
export const loadDisplayContent = ({
  legends = LEGEND_CLASSES,
  specs = LEGEND_SPECS,
  lockedClasses = LOCKED_CLASSES,
}: DisplayCatalogues = {}): DisplayContent => {
  new ContentValidator(createDefaultContentRules()).validate(legends);
  new ContentValidator(createLegendSpecRules(legends)).validate(specs);
  new ContentValidator(createLockedClassRules()).validate(lockedClasses);

  return {
    legends: legends.all(),
    specs: specs.all(),
    lockedClasses: lockedClasses.all(),
    mapFeatures: Object.values(MAP_FEATURE_DEFINITIONS).map(({ id, kind, displayName }) => ({
      id,
      kind,
      displayName,
    })),
    teamNames: TEAM_DISPLAY_NAMES,
    profileDisplayName: PROFILE_DISPLAY_NAME,
  };
};
