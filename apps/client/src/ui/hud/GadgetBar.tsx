import type { ReactElement } from 'react';

import { AbilitySlot } from './AbilitySlot';
import styles from './GadgetBar.module.css';

/**
 * The two gadget slots (Figma 62:275: Courage 62:280, Sword 65:708), one per gadget action, on the
 * same slot path as the abilities (05 §11). The hidden Figma "Gadget 2" (62:276) is not designed.
 */
export function GadgetBar(): ReactElement {
  return (
    <div className={styles.bar}>
      <AbilitySlot slot="gadget-1" appearance="gadget" className={styles.gadget1} />
      <AbilitySlot slot="gadget-2" appearance="gadget" className={styles.gadget2} />
    </div>
  );
}
