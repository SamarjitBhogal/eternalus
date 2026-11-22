import type { Clock } from '../time/Clock.types';
import type { BotLinkFactory } from './BotLink.types';
import type { BotLogger } from './BotLogger';
import type { BotNavigatorSource } from './BotNavigatorSource';

/** What a run needs from the outside world. */
export type BotRunDeps = {
  readonly links: BotLinkFactory;
  readonly navigators: Pick<BotNavigatorSource, 'forSeed'>;
  readonly logger: BotLogger;
  /** Time source for the queue-load numbers. */
  readonly clock: Clock;
  /** Resolves after `ms` milliseconds. */
  readonly sleep: (ms: number) => Promise<void>;
};
