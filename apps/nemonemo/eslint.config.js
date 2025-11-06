import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import tseslint from 'typescript-eslint';

const typescriptConfigs = tseslint.configs.recommendedTypeChecked.map((config) => ({
  ...config,
  files: config.files ?? ['**/*.{ts,tsx,cts,mts}'],
  languageOptions: {
    ...config.languageOptions,
    globals: globals.browser,
    parserOptions: {
      ...config.languageOptions?.parserOptions,
      project: ['./tsconfig.json'],
      tsconfigRootDir: import.meta.dirname
    }
  }
}));

export default [
  {
    ignores: ['dist/**']
  },
  js.configs.recommended,
  ...typescriptConfigs,
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: globals.browser
    },
    plugins: {
      'react-refresh': reactRefresh,
      'react-hooks': reactHooks
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }]
    }
  }
];
