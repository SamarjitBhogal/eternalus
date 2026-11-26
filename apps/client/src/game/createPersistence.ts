import { type Logger, makeLogRecord } from '@eternalus/core';

import { MemoryStorageAdapter } from '../data/persistence/MemoryStorageAdapter';
import { PersistenceController } from '../data/persistence/PersistenceController';
import type { PersistenceControllerDeps } from '../data/persistence/PersistenceController.types';

/** What the page's `PersistenceController` is built from; `main.tsx` passes the page singletons. */
export type PersistenceDeps = Pick<
  PersistenceControllerDeps,
  'adapter' | 'knownActions' | 'now'
> & {
  /** Gets the WARN record of each quarantined record and the ERROR record of a fallback. */
  readonly logger: Logger;
};

/**
 * Builds the page's `PersistenceController` over `deps.adapter` (architecture 14 §2, §10). A
 * quarantined record is logged at WARN `client.persistence`. When the adapter does not open,
 * storage continues on a `MemoryStorageAdapter` and the switch is logged at ERROR
 * `client.persistence`, so it becomes an error report: the session runs, but nothing is saved past
 * it. The records are built here because `data/` imports core types only (14 §1).
 */
export function createPersistence({ logger, ...deps }: PersistenceDeps): PersistenceController {
  return new PersistenceController({
    ...deps,
    warn: (body, attributes) => {
      logger.log(makeLogRecord('WARN', 'client.persistence', body, { attributes }));
    },
    fallback: {
      build: () => new MemoryStorageAdapter(),
      reportError: (body, attributes) => {
        logger.log(makeLogRecord('ERROR', 'client.persistence', body, { attributes }));
      },
    },
  });
}
