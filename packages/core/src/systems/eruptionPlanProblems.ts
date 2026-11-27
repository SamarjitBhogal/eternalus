import { ContentValidationError } from '../content/ContentValidationError';
import type { GameState } from '../state/GameState';
import type { GuardSlot } from '../state/GuardStore.types';
import type { SpawnPlan } from './SpawnSystem.types';

/** The parts of a laid-out guard post the eruption check reads. */
type Post = Pick<GuardSlot, 'homeId' | 'mobId'>;

/**
 * What is wrong with the Greater Boss's posts on one map (`SpawnSystem`'s check once its guard
 * posts are laid out, 12 §3): a summoned `bossIds` entry that no gem-eruption post holds, so the
 * eruption would spawn nothing. Checked only on a map that has gem-eruption posts (a test map or
 * a Duel has none). Each problem once.
 *
 * That no other guard reaches the boss's zone (the leash sums leave the centre-only boss out,
 * DEC-144, DEC-181) is not checked here: the small test maps put towers within reach, and a
 * Cathedral checkpoint's defenders are leashed to the zone itself (`INBOX.md`, the Greater Boss
 * item). `greaterBossSpawn.scenario.test.ts` checks the default map's guard posts.
 *
 * @param posts - Every post laid out at load-in.
 * @param isEruptionPost - Whether a post belongs to a plan activated by the gem's eruption.
 * @param bossIds - The `bossId` of each `summon-greater-boss` timeline entry.
 */
export const eruptionPlanProblems = (
  posts: readonly Post[],
  isEruptionPost: (post: Post) => boolean,
  bossIds: readonly string[],
): string[] => {
  const eruption = posts.filter(isEruptionPost);
  if (eruption.length === 0) return [];
  const unknown = bossIds.filter((bossId) => !eruption.some(({ mobId }) => mobId === bossId));
  return [...new Set(unknown)].map(
    (bossId) => `summon-greater-boss names "${bossId}", which no gem-eruption post holds`,
  );
};

/**
 * `SpawnSystem`'s check of `state`'s laid-out guard posts against the timeline's summoned bosses
 * (`eruptionPlanProblems`).
 *
 * @throws ContentValidationError when there is a problem, so it fails when the match is built.
 */
export const checkEruptionPlan = (
  state: GameState,
  { guards }: Pick<SpawnPlan, 'guards'>,
): void => {
  const bossIds = state.config.match.timeline.flatMap(({ action }) =>
    action.kind === 'summon-greater-boss' ? [action.bossId] : [],
  );
  const posts: GuardSlot[] = [];
  state.guards.forEach((slot) => posts.push(slot));
  const isEruptionPost = ({ homeId }: Post): boolean => {
    const home = state.entities.get(homeId);
    return home !== undefined && guards[home.definitionId]?.activation.at === 'gem-eruption';
  };
  const problems = eruptionPlanProblems(posts, isEruptionPost, bossIds);
  if (problems.length > 0) {
    throw new ContentValidationError(`Invalid Greater Boss plan: ${problems.join('; ')}`);
  }
};
