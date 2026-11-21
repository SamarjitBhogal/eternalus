/**
 * What an attacker that stands inside a building does to that building's walls, as a multiplier on
 * the hit. The owner's number (DEC-247 (2), "being inside a structure does 0.25% more damage to
 * the structure", confirmed as ×1.25), for every building of DEC-288: the Stronghold, the
 * Cathedral and the lane tower forts. The walls keep their own health (DEC-247 (1)), so only the
 * hit changes.
 */
export const INTERIOR_ATTACK_DAMAGE_MULTIPLIER = 1.25;
