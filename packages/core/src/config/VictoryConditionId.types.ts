/**
 * Why a match ended (architecture 12 §6). Lives in `config/` so content and `state/` can name it
 * without importing `match/` (02 §2). Only `objective-lost` has a condition so far; `forfeit` and
 * `aborted` are declared for the conditions that come with the forfeit command.
 */
export type VictoryConditionId = 'objective-lost' | 'forfeit' | 'aborted';
