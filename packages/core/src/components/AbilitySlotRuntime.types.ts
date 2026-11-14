import type { Vec2 } from '../utils/geometry.types';

/**
 * Where a cast is aimed, as `commands/Command.types.ts`'s `Aim` (the same shape; `components/` may
 * not import `commands/`). Ids are plain strings.
 */
export type CastAim = { readonly point: Vec2; readonly targetId: string | null };

/**
 * The slot's last cast as it began (diagnostics: `no-cast-while-not-ready` audits it): the tick,
 * and the cooldown and charge the slot had just before the cast changed them.
 */
export type LastCast = {
  readonly tick: number;
  readonly cooldownUntilTickBefore: number;
  readonly chargeBefore: number;
};
