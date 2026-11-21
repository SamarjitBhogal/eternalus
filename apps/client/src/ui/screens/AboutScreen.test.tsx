import { describe, expect, it } from 'vitest';

import type { CreditEntry } from '../../bridge/events';
import { assetsSlice } from '../../bridge/slices/assetsSlice';
import { STRINGS } from '../strings';
import { buttonNames, renderWithStore } from '../testStore';
import { AboutScreen } from './AboutScreen';

const OFL_TEXT = 'SIL OPEN FONT LICENSE Version 1.1 - 26 February 2007';
const MIT_TEXT = 'Permission is hereby granted, free of charge, to any person obtaining a copy';

const CREDITS: readonly CreditEntry[] = [
  {
    licenceId: 'owner',
    work: 'Eternalus artwork',
    licenceName: 'Owner-made for Eternalus',
    notice: 'Art by the owner.',
    licenceText: null,
    assets: [{ assetId: 'selection-banner', source: 'Figma 62:144 (R1 render)' }],
  },
  {
    licenceId: 'ofl-cinzel',
    work: 'Cinzel typeface',
    licenceName: 'SIL Open Font License 1.1',
    notice: 'Copyright 2020 The Cinzel Project Authors',
    licenceText: `${OFL_TEXT}\n\nPREAMBLE`,
    assets: [{ assetId: 'cinzel-wght', source: 'Google Fonts Cinzel' }],
  },
  {
    licenceId: 'mit-phosphor',
    work: 'Phosphor Icons (placeholder icons)',
    licenceName: 'MIT License',
    notice: 'Copyright (c) 2023 Phosphor Icons',
    licenceText: MIT_TEXT,
    assets: [{ assetId: 'icon-placeholder-atom', source: 'Phosphor Atom' }],
  },
];

const withCredits = {
  assets: assetsSlice.reducer(undefined, assetsSlice.actions.creditsLoaded(CREDITS)),
};

describe('AboutScreen', () => {
  it('shows credits, the licence list and a way back', () => {
    const html = renderWithStore(<AboutScreen />);
    expect(html).toContain(STRINGS.about.credits);
    for (const licence of STRINGS.about.licences) expect(html).toContain(licence);
    expect(buttonNames(html)).toEqual([STRINGS.back]);
  });

  it('lists every credit from the store with its notice, licence text and files', () => {
    const html = renderWithStore(<AboutScreen />, withCredits);

    expect(html).toContain(STRINGS.about.assetCreditsTitle);
    for (const credit of CREDITS) {
      expect(html).toContain(credit.work);
      expect(html).toContain(credit.licenceName);
      expect(html).toContain(credit.notice);
      for (const asset of credit.assets) expect(html).toContain(asset.assetId);
    }
    expect(html).toContain(`${OFL_TEXT}\n\nPREAMBLE`);
    expect(html).toContain(MIT_TEXT);
    expect(html.match(/<details>/g)).toHaveLength(3);
    expect(html.match(/<p class="[^"]+">/g)).toHaveLength(2);
    expect(buttonNames(html)).toEqual([STRINGS.back]);
  });

  it('shows no asset credits before the manifest publishes them', () => {
    expect(renderWithStore(<AboutScreen />)).not.toContain(STRINGS.about.assetCreditsTitle);
  });
});
