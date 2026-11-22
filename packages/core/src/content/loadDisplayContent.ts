import type { PlayableTeam } from '../teams/teams.types';
import { ABILITIES } from './abilities/abilityCatalogue';
import type {
  AuthoredAbility,
  AuthoredAbilityWith,
  AuthoredStep,
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
import { VERDICT_LINES } from './narrative/verdictLines';
import type { VerdictLines } from './narrative/verdictLines.types';
import { STATUS_EFFECTS } from './status-effects/statusEffectCatalogue';
import { PROJECTILES } from './projectiles/projectileCatalogue';
import { PROFILE_DISPLAY_NAME } from './profile/profileDisplayName';
import { SOVEREIGN_DISPLAY_NAMES } from './sovereigns/sovereignDisplayNames';
import { BOT_ROSTER } from './teams/botRoster';
import type { BotRosterDefinition } from './teams/botRoster.types';
import { TEAM_DISPLAY_NAMES } from './teams/teamDisplayNames';
import { ContentValidator } from './validation/ContentValidator';

/**
 * One step of an ability's effect list as the client draws it: what it does and the area it covers,
 * for the range overlay. Each effect strategy describes its own steps (`AbilityEffect.describe`): a
 * dash step is `{ kind: 'dash', distance }`, followed by its `onPath` and `onEnd` steps, whose
 * areas the overlay places along and at the end of that distance; a shot is
 * `{ kind: 'projectile', distance, shape }` (its range and flight path), followed by its `onHit`
 * steps.
 */
export type AbilityDisplayStep = {
  /** The effect kind (`AbilityEffect.kind`): any string, so a new effect kind needs no edit here. */
  readonly kind: string;
  /** The area the step acts on; absent on a step that moves rather than hits (a dash). */
  readonly shape?: EffectShape;
  /** A dash's length or a shot's range, in metres; absent on every other step. */
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
  /**
   * Whether a cast reads the aim the player gives it (the targeting strategy's `usesAim`). False
   * for a cast that aims itself (Fury's dash): the client casts it at once, with no pointer.
   */
  readonly usesAim: boolean;
};

/**
 * Display data the client's selection screens, HUD and results screen show (read-only
 * definitions): the results screen's verdict lines and each team's sovereign name among them.
 */
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
  /**
   * Every status effect's id and display name, in catalogue order. The client keys its status
   * visuals (the wind-up rings) by these ids, and checks at boot that each id it uses is here
   * (ADR 0023), so a renamed status fails the checks rather than drawing nothing.
   */
  readonly statuses: readonly {
    readonly id: string;
    readonly displayName: string;
  }[];
  /**
   * Every projectile id, in catalogue order. The client keys each shot's ending look by these ids,
   * and its tests check that every id has exactly one look (ADR 0023, DEC-306), so a renamed or new
   * projectile fails the checks rather than drawing a look by default.
   */
  readonly projectileIds: readonly string[];
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

/**
 * Turns an ability's effect steps into its overlay rows (`AbilityDisplay.steps`). Each effect kind
 * describes its own steps, so this is the effect strategies' job (`AbilityRegistry.describe`),
 * injected because `content/` does not import `abilities/`. It reads a step by its kind only, so a
 * new effect kind needs no edit here.
 */
export type AbilityStepDescriber = (
  effects: readonly AuthoredStep[],
) => readonly AbilityDisplayStep[];

/**
 * What the effect and targeting strategies tell the display loader about an ability. Injected as
 * the step describer is, because `content/` does not import `abilities/`.
 */
export type AbilityDescriber = {
  /** An ability's overlay rows (`AbilityRegistry.describe`). */
  readonly describeSteps: AbilityStepDescriber;
  /** Whether a cast with this targeting reads the aim (`AbilityRegistry.usesAim`). */
  readonly usesAim: (targeting: { readonly kind: string } | null) => boolean;
};

/** The catalogues `loadDisplayContent` validates and returns; each defaults to the shipped one. */
export type DisplayCatalogues = {
  readonly legends?: ContentCatalogue<LegendDefinition>;
  readonly specs?: ContentCatalogue<LegendSpecDefinition>;
  readonly lockedClasses?: ContentCatalogue<LockedClassDefinition>;
  readonly botRoster?: BotRosterDefinition;
  /** The abilities as authored, whatever their effect kinds (the shipped ones by default). */
  readonly abilities?: ContentCatalogue<AuthoredAbilityWith<AuthoredStep>>;
};

const toAbilityDisplay = (
  ability: AuthoredAbilityWith<AuthoredStep>,
  describer: AbilityDescriber,
): AbilityDisplay => ({
  id: ability.id,
  displayName: ability.displayName,
  description: ability.description,
  slot: ability.slot,
  aetherCost: ability.aetherCost,
  cooldownSeconds: ability.cooldownSeconds,
  isAvailable: ability.effects.length > 0,
  steps: describer.describeSteps(ability.effects),
  usesAim: describer.usesAim(ability.targeting),
});

/**
 * Loads the display content and validates it once: the legends with
 * `createDefaultContentRules(undefined, undefined, abilities, legends)`, then the specs with
 * `createLegendSpecRules(legends, abilities)`, then the locked classes with
 * `createLockedClassRules()`, then the bot roster with `createBotRosterRules(legends)`, each
 * through a `ContentValidator` (04 §5, DEC-22). The display sibling of `loadDefaultContent`
 * (02 §6).
 *
 * @param describer - Each ability's overlay rows and aim use: the strategies' answers. Core
 *   exports this loader with the shipped strategies bound (`loadShippedDisplayContent`).
 * @param catalogues - The catalogues (and the bot roster) to load; each one left out is the
 *   shipped one.
 * @throws ContentValidationError listing every broken rule of the first catalogue that fails (each
 *   catalogue reports all its own problems at once; a catalogue is not checked while one before it
 *   fails).
 */
export const loadDisplayContent = (
  describer: AbilityDescriber,
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
    abilities: abilities.all().map((ability) => toAbilityDisplay(ability, describer)),
    legends: legends.all(),
    specs: specs.all(),
    lockedClasses: lockedClasses.all(),
    mapFeatures: Object.values(MAP_FEATURE_DEFINITIONS).map(({ id, kind, displayName }) => ({
      id,
      kind,
      displayName,
    })),
    statuses: STATUS_EFFECTS.all().map(({ id, displayName }) => ({ id, displayName })),
    projectileIds: PROJECTILES.all().map(({ id }) => id),
    teamNames: TEAM_DISPLAY_NAMES,
    profileDisplayName: PROFILE_DISPLAY_NAME,
    botRoster,
    verdictLines: VERDICT_LINES,
    sovereignNames: SOVEREIGN_DISPLAY_NAMES,
  };
};
