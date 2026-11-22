/**
 * What an attacker that stands inside a building does to that building, as a multiplier on the
 * hit: on the walls of the Stronghold and the Cathedral, and on every hit on a lane tower from
 * inside its fort (DEC-324 (1)). The owner's number (DEC-247 (2), "being inside a structure does
 * 0.25% more damage to the structure", confirmed as ×1.25), for every building of DEC-288. The
 * building keeps its own health (DEC-247 (1)), so only the hit changes.
 */
export const INTERIOR_ATTACK_DAMAGE_MULTIPLIER = 1.25;
