import type { ReactNode } from 'react';

/** What `ErrorBoundary` is given. */
export type ErrorBoundaryProps = {
  /** Which screen this guards, e.g. `match` or `menu.settings`; it goes into the report's source. */
  readonly screen: string;
  readonly children: ReactNode;
};

/** What `ErrorBoundary` keeps. */
export type ErrorBoundaryState = { readonly hasCrashed: boolean };
