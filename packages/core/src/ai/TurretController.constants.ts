/**
 * Ticks between a turret's `attack-aim` decision and its arc shot's first move: the command is
 * applied the next tick, `CombatSystem` spawns the shot then, and it first moves one tick later.
 * The arc shot lands at its aim point, so `predictiveAim` adds these ticks to the flight time
 * (measured in `Simulation.turrets.test.ts`: a decision at tick d lands at d + flight + 3).
 */
export const ARC_LAUNCH_DELAY_TICKS = 3;
