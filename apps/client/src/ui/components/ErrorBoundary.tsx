import { Component, type ErrorInfo, type ReactNode } from 'react';

import { emitIntent } from '../../bridge/eventBus';
import type { ErrorBoundaryProps, ErrorBoundaryState } from './ErrorBoundary.types';

/**
 * The one class component in the codebase (DEC-115; ADR 0025 §5): React offers error boundaries
 * only as classes. It catches a throw while a screen renders or runs its lifecycle methods, shows
 * an empty screen and emits one `report-screen-crash` intent with plain strings, so `ui/` never
 * imports `game/` or `data/`. The session reports the crash and returns to the menu. A boundary
 * that has crashed keeps its fallback, which never renders the screen again, so it cannot report
 * twice or loop; `App` keys it by screen, so it resets when the screen changes. A throw from the
 * game loop, an event handler or async code is not seen here (the match observer's `crashed` and
 * the `window` listeners take those).
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public override state: ErrorBoundaryState = { hasCrashed: false };

  /** React calls this on a throw below: the next render shows the fallback. */
  public static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasCrashed: true };
  }

  /** Emits the crash once; `componentStack` is `''` when React gives none. */
  public override componentDidCatch(error: unknown, info: ErrorInfo): void {
    const { message, stack } =
      error instanceof Error ? error : { message: String(error), stack: '' };
    emitIntent({
      kind: 'report-screen-crash',
      screen: this.props.screen,
      message,
      stack: stack ?? '',
      componentStack: info.componentStack ?? '',
    });
  }

  /** The screen, or nothing after a crash. */
  public override render(): ReactNode {
    // DEC-140 (owner, 2026-11-02; INBOX HC-Q30 item 6): the empty screen stays, with no Reload button.
    return this.state.hasCrashed ? null : this.props.children;
  }
}
