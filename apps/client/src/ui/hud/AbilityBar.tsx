import type { ReactElement } from 'react';

import { AbilitySlot } from './AbilitySlot';
import styles from './AbilityBar.module.css';
import { ChargePips } from './ChargePips';
import { UltimateChargeBar } from './UltimateChargeBar';

/**
 * The ultimate cluster and the abilities (Figma 62:240 without the weapon): charge bar, ultimate,
 * charge boxes, then abilities 1–3, in the Figma's paint order (the ultimate's glow over the bar,
 * the boxes and abilities over the glow). Display order 4, 1, 2, 3 is presentation. Layout only:
 * every child reads its own data.
 */
export function AbilityBar(): ReactElement {
  return (
    <div className={styles.bar}>
      <UltimateChargeBar className={styles.chargeBar} />
      <AbilitySlot slot="ability-4" appearance="ultimate" className={styles.ultimate} />
      <ChargePips className={styles.pips} />
      <AbilitySlot slot="ability-1" appearance="ability" className={styles.ability1} />
      <AbilitySlot slot="ability-2" appearance="ability" className={styles.ability2} />
      <AbilitySlot slot="ability-3" appearance="ability" className={styles.ability3} />
    </div>
  );
}
