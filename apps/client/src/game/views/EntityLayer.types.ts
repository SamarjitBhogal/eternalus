/**
 * Whose side a unit's world health bar shows (DEC-195): the player's team (`ally`) or any other
 * team (`enemy`, camps too). `EntityLayer` picks the bar's fill colour by it.
 */
export type HealthBarSide = 'ally' | 'enemy';
