import type { CathedralGemStrike } from './cathedralGemStrike.types';

/**
 * The gem's lightning (DISC-11: it "strikes attackers with lightning when hit directly"). No doc
 * gives a number or rule, so every value is a placeholder until Sam answers the lightning item in
 * `INBOX.md` ("The gem's lightning on attackers: 11 open rules").
 */
export const CATHEDRAL_GEM_STRIKE: CathedralGemStrike = {
  damage: 50, // TUNE: INBOX.md lightning item (1)
  damageType: 'magical', // TUNE: INBOX.md lightning item (1); not read until damage types exist
  cooldownSeconds: 2, // TUNE: INBOX.md lightning item (2)
  range: 30, // TUNE: INBOX.md lightning item (3)
};
