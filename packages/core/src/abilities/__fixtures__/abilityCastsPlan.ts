import type { Command } from '../../commands/Command.types';
import type { Team } from '../../teams/teams.types';

const spawn = (kind: string, team: Team, x: number, y = 50): Command => ({
  type: 'dev-spawn',
  kind,
  definitionId: kind,
  team,
  at: { x, y },
  count: 1,
});

const castBy = (actorId: string, x: number, y = 50): Command => ({
  type: 'cast-ability',
  actorId,
  slot: 'ability-1',
  aim: { point: { x, y }, targetId: null },
});

/**
 * The first tick a cast can land in the replay's config: its 10 s countdown holds steps 0 to 300
 * (DEC-88; `CountdownPhase`). Fixed, like the config inlined in the replay.
 */
const AFTER_COUNTDOWN = 301;

/**
 * The commands of the ability replay, by the tick they are enqueued before: a Sentinel, a Magus
 * and a Warrior of the light team (`entity-1` to `entity-3`) and dark Legends (`entity-4` to
 * `entity-7`) spawn; the Warrior's cast during the countdown is refused; then the light Legends
 * cast Slam, Shockwave and Blade Runner into the dark ones, the Sentinel tries again on cooldown,
 * the dark Magus hit by Shockwave casts back while concussed, and the dark Magus stunned at the
 * dash's end casts once the stun is over.
 */
export const ABILITY_CASTS_PLAN: Readonly<Record<number, readonly Command[]>> = {
  0: [
    spawn('sentinel', 'light', 50),
    spawn('magus', 'light', 80),
    spawn('warrior', 'light', 110),
    spawn('warrior', 'dark', 52),
    spawn('magus', 'dark', 83),
    spawn('sentinel', 'dark', 114, 50.5),
    spawn('magus', 'dark', 119.5),
  ],
  1: [castBy('entity-3', 130)],
  [AFTER_COUNTDOWN]: [castBy('entity-1', 50), castBy('entity-2', 80), castBy('entity-3', 130)],
  [AFTER_COUNTDOWN + 39]: [castBy('entity-1', 50), castBy('entity-5', 80)],
  [AFTER_COUNTDOWN + 59]: [castBy('entity-7', 110)],
};
