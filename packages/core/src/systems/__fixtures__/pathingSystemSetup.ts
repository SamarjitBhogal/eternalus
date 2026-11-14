import { RANKS_FORMATION } from '../../content/mobs/formations/ranks';
import { NullLogger } from '../../diagnostics/NullLogger';
import { createDefaultStrategyRegistry } from '../../entities/strategies/defaultStrategyRegistry';

/** A logger that drops every record. */
export const logger = new NullLogger();
/** The ranks formation, keyed by its ID. */
export const FORMATIONS = { ranks: RANKS_FORMATION };
/** The movement strategies of the default registry. */
export const STRATEGIES = createDefaultStrategyRegistry().movement;
