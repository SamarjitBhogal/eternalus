import { LEGEND_KINDS } from '../legends/legendKinds';
import { MOB_KINDS } from '../mobs/mobKinds';
import type { UnitClass } from './ai.types';

/**
 * The class the aggro priority list knows an entity kind by (architecture 11 §4.3), or `null` for
 * a kind it never names.
 *
 * @remarks ponytail: no kind is a `turret` until turret entities exist (Phase 2 sprint 2.3), so
 * `turret-attacking-ally-minion` never matches yet (minion plan §3).
 */
export const unitClassOf = (kind: string): UnitClass | null => {
  if (LEGEND_KINDS.hasKind(kind)) {
    return 'legend';
  }
  return MOB_KINDS.hasKind(kind) ? 'minion' : null;
};
