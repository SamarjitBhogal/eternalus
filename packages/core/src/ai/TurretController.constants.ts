/**
 * Ticks a turret adds to its arc shot's flight time when it leads a target (`predictiveAim`). An
 * arc shot lands at its aim point, so the lead must cover every tick the target moves from when
 * the turret sees it to when the shot lands. The turret decides first in a tick, from where the
 * last tick left the target; its `attack-aim` command is applied the next tick, `CombatSystem`
 * spawns the shot then, and the shot first moves one tick later. So a shot fired as its command
 * arrives lands `ceil(flight) + 1` ticks after the decision (pinned in
 * `Simulation.turretLaunch.test.ts`), and the target has moved for `ceil(flight) + 2` ticks. A
 * turret decides every 2 ticks (`AI_CADENCE`), so a shot can also fire one tick after its command,
 * and the target then moves one tick more. A lead of `flight + 3` lies between the two cases.
 */
export const ARC_LAUNCH_DELAY_TICKS = 3;
