/** One hit a `ThreatLedger` remembers. */
export type ThreatHit = {
  readonly attackerId: string;
  readonly tick: number;
  readonly amount: number;
};

/** One attacker's recent damage (`ThreatLedger.totalsSince`). */
export type ThreatTotal = { readonly attackerId: string; readonly amount: number };
