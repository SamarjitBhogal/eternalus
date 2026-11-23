import { LEGEND_KINDS } from '../legends/legendKinds';
import { MOB_KINDS } from '../mobs/mobKinds';
import type { UnitClass } from './ai.types';

/**
 * The class the aggro priority list knows an entity kind by (architecture 11 §4.3), or `null` for
 * a kind it never names.
 *
 * @remarks ponytail: wall turret entities exist (kind `turret`, Phase 2 sprint 2.3), but this
 * function does not map `turret` to a class yet, so `turret-attacking-ally-minion` never matches
 * (minion plan §3). Ceiling: a lane minion does not rank a turret that shoots its allies. Upgrade:
 * map `turret` here; the minion owner's call (INBOX.md HC-B36).
 */
export const unitClassOf = (kind: string): UnitClass | null => {
  if (LEGEND_KINDS.hasKind(kind)) {
    return 'legend';
  }
  return MOB_KINDS.hasKind(kind) ? 'minion' : null;
};
