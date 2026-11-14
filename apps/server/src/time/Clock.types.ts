/** The server's time source (a port): code that needs time takes this, never reads it. */
export interface Clock {
  /** Milliseconds from an arbitrary fixed origin; never goes backwards. */
  nowMs(): number;
}
