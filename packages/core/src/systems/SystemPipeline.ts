import type { System, SystemContext } from './System.types';

/** The systems of a tick in their fixed execution order: list order is run order. */
export class SystemPipeline {
  /** @param systems - Every system, in the order it runs each tick. */
  public constructor(private readonly systems: readonly System[]) {}

  /** Runs every system once, in order. */
  public run(context: SystemContext): void {
    for (const system of this.systems) {
      system.update(context);
    }
  }
}
