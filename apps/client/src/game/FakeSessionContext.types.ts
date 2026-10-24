import type { SessionContext } from './SessionController.types';

/** The names of the `SessionContext` methods (its fields `bus`, `clock`, … left out). */
export type SessionContextMethod = {
  readonly [Name in keyof SessionContext]: SessionContext[Name] extends (
    ...args: never[]
  ) => unknown
    ? Name
    : never;
}[keyof SessionContext];

/** Every recorded call per method: the argument list of each call, in call order. */
export type SessionContextCalls = {
  readonly [Name in SessionContextMethod]: Parameters<SessionContext[Name]>[];
};
