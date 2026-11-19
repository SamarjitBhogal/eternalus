/** TUNE: gaps approved by Gurshaan on 2026-11-17; all other starter values are balancing.md. */
export const STARTER_TUNING = {
  bladeSpeed: 24,
  hamstringSlowMultiplier: 0.7,
  hamstringSlowSeconds: 1.5,
  rendAngleDegrees: 90,
  wallThickness: 0.5,
} as const;

/** Ultimate charge sources from balancing.md, normalized to the framework's 0–1 meter. */
export const ULTIMATE_CHARGE = {
  maximum: 100,
  legendKill: 25,
  assist: 12,
  minionKill: 1,
  structureHealthFractionPerPoint: 0.02,
  bossHealthFractionPerPoint: 0.01,
  deathLoss: 15,
  lockoutSeconds: 10,
  assistWindowSeconds: 10,
} as const;

/** Fury's documented basic-attack knockback and status link (balancing.md). */
export const FURY_HIT = { statusId: 'fury', knockback: 1 } as const;
