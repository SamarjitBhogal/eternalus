import type { AggroRuleDefinition } from '../content/ai/ai.types';
import type { Decision, DecisionInput } from './Controller.types';
import { LeashBehaviour } from './LeashBehaviour';
import type { LeashDecisionParts } from './LeashBehaviour.types';

/**
 * The decision `MinionController` and `GuardController` share (AI56-F5, DEC-168 B1): looks up the
 * brain's aggro profile among the controller's own, reads its memory, finds where the mob stands
 * and runs one `behaviour` step with the rules and objective the controller adds. A mob that
 * cannot decide (not indexed, teamless, or `situate` gives nothing) keeps the memory it read and
 * emits nothing. Pure: the commands and the brain after are returned, never applied.
 *
 * @throws Error when the brain names an aggro profile the controller does not have (a content
 *   error).
 */
export const decideLeashed = <Idle extends string, Rule extends AggroRuleDefinition>(
  { state, entityId, brain, perception }: DecisionInput,
  behaviour: LeashBehaviour,
  { controllerId, profileOf, states, idle, situate }: LeashDecisionParts<Idle, Rule>,
): Decision => {
  const rule = profileOf(brain.profileId);
  if (rule === undefined) {
    throw new Error(
      `Entity "${entityId}" names aggro profile "${brain.profileId}", which controller "${controllerId}" does not have.`,
    );
  }
  const memory = LeashBehaviour.read(brain.memory, states, idle, (id) =>
    state.entities.isAlive(id),
  );
  const index = state.space?.indexOf(entityId);
  const team = state.entities.teamOf(entityId);
  const parts = situate(state, entityId);
  if (state.space === null || index === undefined || team === undefined || parts === null) {
    return { commands: [], memory, rngState: brain.rngState };
  }
  const position = {
    x: state.space.positions[2 * index] ?? 0,
    y: state.space.positions[2 * index + 1] ?? 0,
  };
  const situation = {
    state,
    id: entityId,
    team,
    position,
    rule,
    perception,
    objective: parts.objective,
  };
  const step = behaviour.step(situation, memory, parts.rules);
  return { commands: step.commands, memory: step.memory, rngState: brain.rngState };
};
