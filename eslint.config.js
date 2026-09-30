// @ts-check
import js from '@eslint/js';
import vitest from '@vitest/eslint-plugin';
import prettier from 'eslint-config-prettier/flat';
import reactHooks from 'eslint-plugin-react-hooks';
import { defineConfig, globalIgnores } from 'eslint/config';
import tseslint from 'typescript-eslint';

export default defineConfig(
  globalIgnores(['**/dist/', '**/coverage/']),

  js.configs.recommended,

  {
    files: ['**/*.{ts,tsx}'],
    extends: [tseslint.configs.strictTypeChecked, tseslint.configs.stylisticTypeChecked],
    languageOptions: {
      parserOptions: { projectService: true, tsconfigRootDir: import.meta.dirname },
    },
    rules: {
      'no-console': 'error',
      '@typescript-eslint/consistent-type-definitions': 'off',
    },
  },

  {
    files: ['apps/client/src/**/*.tsx'],
    extends: [reactHooks.configs.flat['recommended-latest']],
  },

  {
    files: ['packages/core/src/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        { patterns: ['react', 'react-dom', 'react-redux', '@reduxjs/*', '@eternalus/client'] },
      ],
      'no-restricted-properties': [
        'error',
        {
          object: 'Math',
          property: 'random',
          message: 'core must be deterministic: use a seeded RNG.',
        },
      ],
    },
  },

  {
    files: ['**/*.test.{ts,tsx}'],
    extends: [vitest.configs.recommended],
    rules: { 'vitest/no-disabled-tests': 'error' },
  },

  {
    files: ['**/*.js'],
    extends: [tseslint.configs.disableTypeChecked],
  },

  {
    // Zero-dependency Node scripts (agent hooks, docs check). Plain ESM, no type checking.
    files: ['scripts/**/*.mjs'],
    languageOptions: {
      globals: { process: 'readonly', console: 'readonly', Buffer: 'readonly', URL: 'readonly' },
    },
  },

  prettier,
);
