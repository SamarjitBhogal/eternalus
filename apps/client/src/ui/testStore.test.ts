import { createElement } from 'react';
import { describe, expect, it } from 'vitest';

import { assetsSlice } from '../bridge/slices/assetsSlice';
import { AssetImage } from './components/AssetImage';
import { accessibleNames, buttonNames, renderWithStore } from './testStore';

describe('accessibleNames: name from content (button, [role=radio])', () => {
  it('resolves aria-labelledby naming a text leaf, then aria-label', () => {
    const html =
      '<h2 id="cta">Select Class</h2><button aria-labelledby="cta"><b>ignored</b></button>' +
      '<button aria-label="Next class"><svg aria-hidden="true"><path d="M0 0"></path></svg></button>';

    expect(accessibleNames(html, 'button')).toEqual(['Select Class', 'Next class']);
  });

  it('reads the text without aria-hidden subtrees, a nested same-tag element removed whole', () => {
    const html =
      '<button type="button"><span aria-hidden="true">esc<span>ape</span> </span>back</button>' +
      '<button>  Lock <img src="/a.webp" alt=""/>\n in </button>';

    expect(accessibleNames(html, 'button')).toEqual(['back', 'Lock in']);
  });

  it('ignores a void element written without a slash inside a hidden subtree', () => {
    const html = '<button><span aria-hidden="true"><img src="/a.webp"><br></span>Go</button>';

    expect(accessibleNames(html, 'button')).toEqual(['Go']);
  });

  it('names radio cards from their content and decodes the server renderer’s entities', () => {
    const html =
      '<div role="radiogroup" aria-label="Classes">' +
      '<button role="radio" aria-checked="true"><span>Magus</span><i aria-hidden="true">✦</i></button>' +
      '<button role="radio" aria-checked="false">Rock &amp; Roll&#x27;s &quot;best&quot;</button></div>';

    expect(accessibleNames(html, '[role=radio]')).toEqual(['Magus', 'Rock & Roll\'s "best"']);
  });

  it('names React’s own markup the same way', () => {
    const html = renderWithStore(
      createElement(
        'button',
        { type: 'button' },
        createElement('span', { 'aria-hidden': true }, 'esc'),
        'back',
      ),
    );

    expect(accessibleNames(html, 'button')).toEqual(['back']);
  });
});

describe('accessibleNames: name from author (every other selector)', () => {
  it('gives an unlabelled group the empty name, never its text', () => {
    expect(accessibleNames('<div role="group"><div>a</div> b</div>', '[role=group]')).toEqual(['']);
    expect(
      accessibleNames('<div role="group" aria-label="Your structures">x</div>', '[role=group]'),
    ).toEqual(['Your structures']);
  });

  it('names radiogroups, dialogs, meters and images by aria-labelledby or aria-label only', () => {
    const html =
      '<p id="title">Choose Your Class</p>' +
      '<div role="radiogroup" aria-labelledby="title"><button role="radio">Magus</button></div>' +
      '<div role="dialog" aria-label="Paused"><button>Resume</button></div>' +
      '<div role="meter" aria-valuenow="5">50%</div>' +
      '<div role="img" aria-label="Health: No data yet"><i></i></div>' +
      '<div tabindex="-1">Settings</div>';

    expect(accessibleNames(html, '[role=radiogroup]')).toEqual(['Choose Your Class']);
    expect(accessibleNames(html, '[role=dialog]')).toEqual(['Paused']);
    expect(accessibleNames(html, '[role=meter]')).toEqual(['']);
    expect(accessibleNames(html, '[role=img]')).toEqual(['Health: No data yet']);
    expect(accessibleNames(html, '[tabindex]')).toEqual(['']);
  });

  it('refuses the forms it does not compute', () => {
    const list = '<p id="a">A</p><p id="b">B</p><div role="group" aria-labelledby="a b"></div>';
    const notLeaf = '<p id="a"><b>A</b></p><div role="group" aria-labelledby="a"></div>';

    expect(() => accessibleNames(list, '[role=group]')).toThrow(/one text-leaf element/);
    expect(() => accessibleNames(notLeaf, '[role=group]')).toThrow(/one text-leaf element/);
    expect(() => accessibleNames('<button>A</button>', '.card')).toThrow(/unsupported selector/);
  });
});

describe('buttonNames', () => {
  it('still reads each button’s text content', () => {
    expect(buttonNames('<button>A</button><button type="button"><b>B</b></button>')).toEqual([
      'A',
      'B',
    ]);
  });
});

describe('renderWithStore', () => {
  it('loads every asset TEST_CONTENT names, with a URL per rendition', () => {
    const portrait = renderWithStore(
      createElement(AssetImage, { assetId: 'oracle-portrait', rendition: 'ally-tile' }),
    );
    const minimap = renderWithStore(createElement(AssetImage, { assetId: 'minimap-frame' }));
    const unnamed = renderWithStore(createElement(AssetImage, { assetId: 'not-in-test-content' }));

    expect(portrait).toContain('src="/assets/test/oracle-portrait@ally-tile.webp"');
    expect(minimap).toContain('src="/assets/test/minimap-frame.webp"');
    expect(unnamed).toBe('');
  });

  it('starts with nothing loaded when the test passes an empty assets state', () => {
    const html = renderWithStore(createElement(AssetImage, { assetId: 'oracle-portrait' }), {
      assets: assetsSlice.getInitialState(),
    });

    expect(html).toBe('');
  });
});
