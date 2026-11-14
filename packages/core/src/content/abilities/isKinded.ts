import type { AuthoredStep } from './AbilityDefinition.types';

/**
 * Whether `value` is an object with a string `kind`: an effect step, or a shape inside one. The one
 * guard `loadAbilities` and `abilities/effectSteps.ts` read a step's kind with (`abilities/` may
 * import `content/`, not the reverse).
 */
export const isKinded = (value: unknown): value is AuthoredStep =>
  typeof value === 'object' && value !== null && 'kind' in value && typeof value.kind === 'string';
