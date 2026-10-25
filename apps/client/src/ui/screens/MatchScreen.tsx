import { type ReactElement, useRef } from 'react';

import { useAppSelector } from '../../bridge/hooks';
import { AbilityBar } from '../hud/AbilityBar';
import { AetherBar } from '../hud/AetherBar';
import { CrystalStatus } from '../hud/CrystalStatus';
import { GadgetBar } from '../hud/GadgetBar';
import { HealthBar } from '../hud/HealthBar';
import { HudFilters } from '../hud/HudFilters';
import { LevelBadge } from '../hud/LevelBadge';
import { MatchClock } from '../hud/MatchClock';
import { MinimapPanel } from '../hud/MinimapPanel';
import { ObjectiveTracker } from '../hud/ObjectiveTracker';
import { PauseOverlay } from '../hud/PauseOverlay';
import { StructureStrip } from '../hud/StructureStrip';
import { type PauseOpenerRef, usePauseMenuKey } from '../hud/usePauseMenuKey';
import { WeaponPanel } from '../hud/WeaponPanel';
import { STRINGS } from '../strings';
import styles from './MatchScreen.module.css';
import type { ScreenProps } from './screen.types';

/**
 * The match screen (13 §3, Figma 62:231): the game viewport full-bleed, the HUD over it (a size
 * container whose `--hud-u` is one Figma px, so the 1920 × 1080 layout scales uniformly) with its
 * nine regions in the Figma's paint order, and the pause overlay beside both. It reads only the
 * open overlay (each HUD leaf reads its own data, so a publish never re-renders it). While an
 * overlay is open the viewport and the HUD are `inert` (13 §7; CD-11) and the session pauses the
 * match.
 */
export function MatchScreen({ viewport }: ScreenProps): ReactElement {
  const overlay = useAppSelector((state) => state.session.overlay);
  const openerRef: PauseOpenerRef = useRef<Element | null>(null);
  usePauseMenuKey(overlay, openerRef);
  const isInert = overlay !== null;
  return (
    <main className={styles.screen}>
      <div className={styles.viewport} inert={isInert}>
        {viewport}
      </div>
      <section className={styles.hud} aria-label={STRINGS.hud.label} inert={isInert}>
        <HudFilters />
        <div className={styles.abilities} data-hud-region="abilities">
          <AbilityBar />
        </div>
        <div className={styles.weapon} data-hud-region="weapon">
          <WeaponPanel />
        </div>
        <div className={styles.gadgets} data-hud-region="gadgets">
          <GadgetBar />
        </div>
        <div className={styles.resources} data-hud-region="resources">
          <HealthBar />
          <AetherBar className={styles.aether} />
        </div>
        <div className={styles.level} data-hud-region="level">
          <LevelBadge />
        </div>
        <div className={styles.topStrip} data-hud-region="structures-objectives">
          <StructureStrip side="allied" />
          <ObjectiveTracker />
          <StructureStrip side="enemy" />
        </div>
        <div className={styles.crystal} data-hud-region="crystal">
          <CrystalStatus />
        </div>
        <div className={styles.clock} data-hud-region="clock">
          <MatchClock />
        </div>
        <div className={styles.minimap} data-hud-region="minimap">
          <MinimapPanel />
        </div>
      </section>
      <PauseOverlay openerRef={openerRef} />
    </main>
  );
}
