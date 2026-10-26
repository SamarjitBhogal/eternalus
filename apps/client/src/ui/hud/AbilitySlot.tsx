import type { ReactElement } from 'react';

import type { HudSlotId } from '../../bridge/Binding.types';
import type { HudBlockReason } from '../../bridge/hud.types';
import { shallowEqual, useAppSelector } from '../../bridge/hooks';
import { type HudSlotLook, selectHudSlotView } from '../../bridge/selectors/selectHudSlotView';
import { AssetImage } from '../components/AssetImage';
import { classNames } from '../components/classNames';
import { KeyGlyph } from '../components/KeyGlyph';
import { ACTION_LABELS, STRINGS } from '../strings';
import styles from './AbilitySlot.module.css';
import { AbilitySlotFrame } from './AbilitySlotFrame';

/** Where the icon and key glyph sit: the abilities, the ultimate, or a gadget (127 px icon box). */
type AbilitySlotAppearance = 'ability' | 'ultimate' | 'gadget';

const APPEARANCE_CLASS: Readonly<Record<AbilitySlotAppearance, string | undefined>> = {
  ability: styles.ability,
  ultimate: styles.ultimate,
  gadget: styles.gadget,
};

/** The state part of a slot's accessible name, per look. */
const LOOK_STATE: Readonly<Record<HudSlotLook, (reason: HudBlockReason | null) => string>> = {
  ready: () => STRINGS.hud.ready,
  cooldown: () => STRINGS.hud.blockedBy['on-cooldown'],
  idle: (reason) => (reason === null ? STRINGS.hud.notReady : STRINGS.hud.blockedBy[reason]),
  'no-data': () => STRINGS.noDataYet,
};

/**
 * One ability or gadget slot (05 §15; the same path for gadgets, 05 §11), with OD-9's looks: the
 * gold glow when ready, the red vertical gradient while cooling down, filled from the bottom by
 * the share of the cooldown still to run (the cooldown sweep 13 §3 asks for, as a vertical fill),
 * the plain frame when blocked (icon dimmed), the hatch before any data. The icon comes from the
 * class kit and every slot shows the `KeyGlyph` of its action (FR-081). `className` places it.
 */
export function AbilitySlot({
  slot,
  appearance,
  className,
}: {
  readonly slot: HudSlotId;
  readonly appearance: AbilitySlotAppearance;
  readonly className?: string | undefined;
}): ReactElement {
  const view = useAppSelector((state) => selectHudSlotView(state, slot), shallowEqual);
  const isBlocked =
    view.look === 'idle' && view.blockedBy !== null && view.blockedBy !== 'empty-slot';
  return (
    <div
      role="group"
      aria-label={STRINGS.hud.slot(
        ACTION_LABELS[slot],
        view.displayName ?? (view.iconAssetId === null ? STRINGS.hud.emptySlot : null),
        LOOK_STATE[view.look](view.blockedBy),
      )}
      data-slot={slot}
      data-look={view.look}
      className={classNames(
        styles.slot,
        APPEARANCE_CLASS[appearance],
        isBlocked && styles.isBlocked,
        className,
      )}
    >
      <AbilitySlotFrame slot={slot} look={view.look} cooldownFraction={view.cooldownFraction} />
      {view.look === 'no-data' && <div className={styles.hatch} aria-hidden="true" />}
      <AssetImage assetId={view.iconAssetId} className={classNames(styles.icon)} />
      <span className={styles.glyph}>
        <KeyGlyph action={slot} appearance="hud" />
      </span>
    </div>
  );
}
