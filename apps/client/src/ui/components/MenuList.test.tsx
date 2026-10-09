import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { buttonNames } from '../testStore';
import { MenuList } from './MenuList';

describe('MenuList', () => {
  it('renders a labelled nav with one button per item, in order', () => {
    const items = ['One', 'Two', 'Three'].map((label) => ({
      id: label,
      label,
      onSelect: () => undefined,
    }));
    const html = renderToStaticMarkup(<MenuList label="Choices" items={items} />);
    expect(html).toContain('<nav aria-label="Choices">');
    expect(buttonNames(html)).toEqual(['One', 'Two', 'Three']);
  });
});
