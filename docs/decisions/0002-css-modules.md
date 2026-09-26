# 0002. Style React with CSS Modules

- Status: accepted
- Date: 2026-09-26

## Context

The UI is menus and a HUD. We want scoped styles without a runtime CSS-in-JS library or a utility framework the whole team must learn.

## Decision

Use **CSS Modules**: each component has a co-located `Component.module.css` with camelCase class names (Vite `localsConvention: camelCaseOnly`). Global CSS is limited to variables and reset in `apps/client/src/styles/`.

## Consequences

- Zero runtime cost, no extra dependency, plain CSS skills apply.
- Class names are not type-checked (a typo yields `undefined`); consider typed CSS module generation later if this bites.
- Design tokens live as CSS variables in `styles/global.css`.
