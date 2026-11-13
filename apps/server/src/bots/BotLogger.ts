import type { Clock } from '../time/Clock.types';

/** Where bot lines go. */
export type BotOutput = {
  out(line: string): void;
  err(line: string): void;
};

/** Timestamps the bots' progress lines with the seconds since the run began. */
export class BotLogger {
  private readonly startedMs: number;

  public constructor(
    private readonly output: BotOutput,
    private readonly clock: Clock,
  ) {
    this.startedMs = clock.nowMs();
  }

  /** One progress line for the player `name`. */
  public log(name: string, text: string): void {
    const seconds = ((this.clock.nowMs() - this.startedMs) / 1000).toFixed(1);
    this.output.out(`[${seconds.padStart(5)}s] ${name}: ${text}`);
  }

  /** A line without a player or timestamp. */
  public plain(line: string): void {
    this.output.out(line);
  }

  /** A line on the error stream. */
  public fail(line: string): void {
    this.output.err(line);
  }
}
