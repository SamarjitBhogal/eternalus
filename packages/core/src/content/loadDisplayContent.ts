import type { PlayableTeam } from '../teams/teams.types';
import { ABILITIES } from './abilities/abilityCatalogue';
import type {
  AuthoredAbility,
  AuthoredEffectSpec,
  EffectShape,
} from './abilities/AbilityDefinition.types';
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
import { PROFILE_DISPLAY_NAME } from './profile/profileDisplayName';
import { BOT_ROSTER } from './teams/botRoster';
import type { BotRosterDefinition } from './teams/botRoster.types';
import { TEAM_DISPLAY_NAMES } from './teams/teamDisplayNames';
import { ContentValidator } from './validation/ContentValidator';

/**
 * One step of an ability's effect list as the client draws it: what it does and the area it covers,
 * for the range overlay. Each effect strategy describes its own steps (`AbilityEffect.describe`): a
 * dash step is `{ kind: 'dash', shape: path, distance }` (the path as wide as its widest `onPath`
 * path step), followed by its `onPath` and `onEnd` steps.
 */
export type AbilityDisplayStep = {
  readonly kind: AuthoredEffectSpec['kind'];
  readonly shape: EffectShape;
  /** A dash's length in metres; absent on every other step. */
  readonly distance?: number;
};

/**
 * An ability as the kit rows, the HUD and the aim overlay show it (read-only; seconds, not ticks).
 * An ability with no effects is `isAvailable: false`: it is in a kit but cannot be cast yet.
 */
export type AbilityDisplay = {
  readonly id: string;
  readonly displayName: string;
  readonly description: string;
  /** `ultimate` for the key-4 ability. */
  readonly slot: AuthoredAbility['slot'];
  readonly aetherCost: number;
  readonly cooldownSeconds: number;
  readonly isAvailable: boolean;
  /** Every effect step's area, in cast order. */
  readonly steps: readonly AbilityDisplayStep[];
};

/** Display data the client's selection screens and HUD show (read-only definitions). */
export type DisplayContent = {
  readonly legends: readonly LegendDefinition[];
  readonly specs: readonly LegendSpecDefinition[];
  /** Every ability, in catalogue order; kits name them by id (`LegendDefinition.defaultKit`). */
  readonly abilities: readonly AbilityDisplay[];
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
};

/**
 * Turns an ability's effect steps into its overlay rows (`AbilityDisplay.steps`). Each effect kind
 * describes its own steps, so this is the effect strategies' job (`AbilityRegistry.describe`),
 * injected because `content/` does not import `abilities/`.
 */
export type AbilityStepDescriber = (
  effects: readonly AuthoredEffectSpec[],
) => readonly AbilityDisplayStep[];

/** The catalogues `loadDisplayContent` validates and returns; each defaults to the shipped one. */
export type DisplayCatalogues = {
  readonly legends?: ContentCatalogue<LegendDefinition>;
  readonly specs?: ContentCatalogue<LegendSpecDefinition>;
  readonly lockedClasses?: ContentCatalogue<LockedClassDefinition>;
  readonly botRoster?: BotRosterDefinition;
  readonly abilities?: ContentCatalogue<AuthoredAbility>;
};

const toAbilityDisplay = (
  ability: AuthoredAbility,
  describeSteps: AbilityStepDescriber,
): AbilityDisplay => ({
  id: ability.id,
  displayName: ability.displayName,
  description: ability.description,
  slot: ability.slot,
  aetherCost: ability.aetherCost,
  cooldownSeconds: ability.cooldownSeconds,
  isAvailable: ability.effects.length > 0,
  steps: describeSteps(ability.effects),
});

/**
 * Loads the display content and validates it once: the legends with
 * `createDefaultContentRules(undefined, undefined, abilities, legends)`, then the specs with
 * `createLegendSpecRules(legends, abilities)`, then the locked classes with
 * `createLockedClassRules()`, then the bot roster with `createBotRosterRules(legends)`, each
 * through a `ContentValidator` (04 §5, DEC-22). The display sibling of `loadDefaultContent`
 * (02 §6).
 *
 * @param describeSteps - Each ability's overlay rows: the effect strategies' descriptions. Core
 *   exports this loader with the shipped strategies bound (`loadShippedDisplayContent`).
 * @param catalogues - The catalogues (and the bot roster) to load; each one left out is the
 *   shipped one.
 * @throws ContentValidationError listing every broken rule of the first catalogue that fails (each
 *   catalogue reports all its own problems at once; a catalogue is not checked while one before it
 *   fails).
 */
export const loadDisplayContent = (
  describeSteps: AbilityStepDescriber,
  {
    legends = LEGEND_CLASSES,
    specs = LEGEND_SPECS,
    lockedClasses = LOCKED_CLASSES,
    botRoster = BOT_ROSTER,
    abilities = ABILITIES,
  }: DisplayCatalogues = {},
): DisplayContent => {
  new ContentValidator(
    createDefaultContentRules(undefined, undefined, abilities, legends),
  ).validate(legends);
  new ContentValidator(createLegendSpecRules(legends, abilities)).validate(specs);
  new ContentValidator(createLockedClassRules()).validate(lockedClasses);
  new ContentValidator(createBotRosterRules(legends)).validate(new ContentCatalogue([botRoster]));

  return {
    abilities: abilities.all().map((ability) => toAbilityDisplay(ability, describeSteps)),
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
  };
};
