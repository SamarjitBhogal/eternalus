import type { Vec2 } from '../utils/geometry.types';

/**
 * Where an ability is aimed: a world point and, for targeted abilities, the target's entity id.
 * The one aim type: it lives here, the lowest layer that holds one (a slot's pending cast), and
 * `commands/Command.types.ts` re-exports it for the `cast-ability` command (ADR 0026 decision 2).
 */
export type Aim = { readonly point: Vec2; readonly targetId: string | null };

/**
 * The slot's last cast as it began (diagnostics: `no-cast-while-not-ready` audits it): the tick,
 * and the cooldown and charge the slot had just before the cast changed them.
 */
export type LastCast = {
  readonly tick: number;
  readonly cooldownUntilTickBefore: number;
  readonly chargeBefore: number;
};
