import type { ReactElement } from 'react';

import { emitIntent } from '../../bridge/eventBus';
import { useAppSelector } from '../../bridge/hooks';
import { type SettingsPatch, settingsSlice } from '../../bridge/slices/settingsSlice';
import { STRINGS } from '../strings';
import styles from './SettingsScreenOptions.module.css';

const { selectAccessibility, selectAudio, selectVideo } = settingsSlice.selectors;
const VOLUMES = ['master', 'music', 'effects'] as const;
// TUNE: render-scale choices and the 5 % volume step (below) are provisional UI options.
const RENDER_SCALES: readonly number[] = [0.5, 0.75, 1];

function percent(fraction: number): number {
  return Math.round(fraction * 100);
}

function update(patch: SettingsPatch): void {
  emitIntent({ kind: 'update-settings', patch });
}

/** The Audio, Video and Accessibility tabs: sliders and toggles bound to `settingsSlice`. */
export function SettingsScreenOptions({
  tab,
}: {
  readonly tab: 'audio' | 'video' | 'accessibility';
}): ReactElement {
  const audio = useAppSelector(selectAudio);
  const video = useAppSelector(selectVideo);
  const accessibility = useAppSelector(selectAccessibility);

  if (tab === 'audio') {
    return (
      <div className={styles.options}>
        {VOLUMES.map((field) => (
          <label key={field} className={styles.field}>
            <span>{STRINGS.settings.volume[field]}</span>
            <input
              type="range"
              min={0}
              max={100}
              step={5}
              value={percent(audio[field])}
              onChange={(event) => {
                update({ audio: { [field]: Number(event.currentTarget.value) / 100 } });
              }}
            />
            <output>{percent(audio[field])}%</output>
          </label>
        ))}
      </div>
    );
  }
  if (tab === 'video') {
    return (
      <div className={styles.options}>
        <label className={styles.field}>
          <span>{STRINGS.settings.fullscreen}</span>
          <input
            type="checkbox"
            checked={video.fullscreen}
            onChange={(event) => {
              update({ video: { fullscreen: event.currentTarget.checked } });
            }}
          />
        </label>
        <label className={styles.field}>
          <span>{STRINGS.settings.renderScale}</span>
          <select
            value={video.renderScale}
            onChange={(event) => {
              update({ video: { renderScale: Number(event.currentTarget.value) } });
            }}
          >
            {RENDER_SCALES.map((scale) => (
              <option key={scale} value={scale}>
                {percent(scale)}%
              </option>
            ))}
          </select>
        </label>
      </div>
    );
  }
  return (
    <div className={styles.options}>
      <label className={styles.field}>
        <span>{STRINGS.settings.reduceMotion}</span>
        <input
          type="checkbox"
          checked={accessibility.reduceMotion}
          onChange={(event) => {
            update({ accessibility: { reduceMotion: event.currentTarget.checked } });
          }}
        />
      </label>
      <label className={styles.field}>
        <span>{STRINGS.settings.colourBlindMode}</span>
        <input
          type="checkbox"
          checked={accessibility.colourBlindMode}
          onChange={(event) => {
            update({ accessibility: { colourBlindMode: event.currentTarget.checked } });
          }}
        />
      </label>
    </div>
  );
}
