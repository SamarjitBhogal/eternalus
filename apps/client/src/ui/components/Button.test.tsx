import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { Button } from './Button';

describe('Button', () => {
  it('renders a non-submit button named by its text', () => {
    const html = renderToStaticMarkup(<Button onClick={() => undefined}>Go</Button>);
    expect(html).toMatch(/^<button type="button"[^>]*>Go<\/button>$/);
  });
});
