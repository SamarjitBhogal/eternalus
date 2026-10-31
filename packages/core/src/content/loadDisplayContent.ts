import type { PlayableTeam } from '../teams/teams.types';
import { ContentCatalogue } from './ContentCatalogue';
import {
  createBotRosterRules,
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
import { VERDICT_LINES } from './narrative/verdictLines';
import type { VerdictLines } from './narrative/verdictLines.types';
import { PROFILE_DISPLAY_NAME } from './profile/profileDisplayName';
import { SOVEREIGN_DISPLAY_NAMES } from './sovereigns/sovereignDisplayNames';
import { BOT_ROSTER } from './teams/botRoster';
import type { BotRosterDefinition } from './teams/botRoster.types';
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
  /** Who the bots are: each team's lane bots and the enemy Rover's rule (DEC-61, DEC-102). */
  readonly botRoster: BotRosterDefinition;
  /** The results screen's line under the verdict, per victory condition and side (12 §9). */
  readonly verdictLines: VerdictLines;
  /** Each team's sovereign display name ("Emperor" by default, DEC-74); fills a verdict line. */
  readonly sovereignNames: Readonly<Record<PlayableTeam, string>>;
};

/** The catalogues `loadDisplayContent` validates and returns; each defaults to the shipped one. */
type DisplayCatalogues = {
  readonly legends?: ContentCatalogue<LegendDefinition>;
  readonly specs?: ContentCatalogue<LegendSpecDefinition>;
  readonly lockedClasses?: ContentCatalogue<LockedClassDefinition>;
  readonly botRoster?: BotRosterDefinition;
};

/**
 * Loads the display content and validates it once: the legends with `createDefaultContentRules()`,
 * then the specs with `createLegendSpecRules(legends)`, then the locked classes with
 * `createLockedClassRules()`, then the bot roster with `createBotRosterRules(legends)`, each
 * through a `ContentValidator` (04 §5, DEC-22). The display sibling of `loadDefaultContent`
 * (02 §6).
 *
 * @param catalogues - The catalogues (and the bot roster) to load; each one left out is the
 *   shipped one.
 * @throws ContentValidationError listing every broken rule of the first catalogue that fails (each
 *   catalogue reports all its own problems at once; a catalogue is not checked while one before it
 *   fails).
 */
export const loadDisplayContent = ({
  legends = LEGEND_CLASSES,
  specs = LEGEND_SPECS,
  lockedClasses = LOCKED_CLASSES,
  botRoster = BOT_ROSTER,
}: DisplayCatalogues = {}): DisplayContent => {
  new ContentValidator(createDefaultContentRules()).validate(legends);
  new ContentValidator(createLegendSpecRules(legends)).validate(specs);
  new ContentValidator(createLockedClassRules()).validate(lockedClasses);
  new ContentValidator(createBotRosterRules(legends)).validate(new ContentCatalogue([botRoster]));

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
    botRoster,
    verdictLines: VERDICT_LINES,
    sovereignNames: SOVEREIGN_DISPLAY_NAMES,
  };
};
