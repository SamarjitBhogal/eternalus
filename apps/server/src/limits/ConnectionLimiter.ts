/**
 * Caps open connections in total and per remote IP (ADR 0016 point 7). The listener asks before
 * it accepts a client and gives the slot back when the client closes.
 */
export class ConnectionLimiter {
  private total = 0;
  private readonly perIp = new Map<string, number>();

  public constructor(
    private readonly maxTotal: number,
    private readonly maxPerIp: number,
  ) {}

  /** Takes a slot for `ip`; `false` (and nothing taken) when either cap is reached. */
  public tryAcquire(ip: string): boolean {
    const held = this.perIp.get(ip) ?? 0;
    if (this.total >= this.maxTotal || held >= this.maxPerIp) return false;
    this.total += 1;
    this.perIp.set(ip, held + 1);
    return true;
  }

  /** Gives back a slot taken for `ip`. */
  public release(ip: string): void {
    const held = this.perIp.get(ip) ?? 0;
    if (held === 0) return;
    this.total -= 1;
    if (held === 1) this.perIp.delete(ip);
    else this.perIp.set(ip, held - 1);
  }
}
