import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

import { errorReportsPlugin } from './errorReportsPlugin.ts';
import { ERROR_REPORTS_FOLDER } from './errorReportsPlugin.constants.ts';

/** The repository root, two folders above this file. */
const REPO_ROOT = fileURLToPath(new URL('../../', import.meta.url));

/** The root `package.json` version, or `'unknown'` (ADR 0025 §3). */
function gameVersion(): string {
  const root: unknown = JSON.parse(readFileSync(path.join(REPO_ROOT, 'package.json'), 'utf8'));
  return typeof root === 'object' && root !== null && 'version' in root
    ? String(root.version)
    : 'unknown';
}

/** The short commit at serve or build time, or `'unknown'` when git fails (ADR 0025 §3). */
function gitCommit(): string {
  try {
    return execFileSync('git', ['rev-parse', '--short', 'HEAD'], {
      cwd: REPO_ROOT,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    }).trim();
  } catch {
    return 'unknown';
  }
}

export default defineConfig({
  plugins: [react(), errorReportsPlugin({ dir: path.join(REPO_ROOT, ERROR_REPORTS_FOLDER) })],
  // Declared in src/buildInfo.d.ts; error reports carry them (ADR 0025 §3).
  define: {
    __GAME_VERSION__: JSON.stringify(gameVersion()),
    __GAME_COMMIT__: JSON.stringify(gitCommit()),
  },
  css: {
    modules: {
      localsConvention: 'camelCaseOnly',
    },
  },
  build: {
    target: 'es2023',
    sourcemap: true,
    // Never inline assets as data: URIs: each loads with its own group, by bytes (14 §11).
    assetsInlineLimit: 0,
  },
});
