const tsEslint = require('@typescript-eslint/eslint-plugin');

module.exports = [
  {
    ignores: ['node_modules/**', '.next/**', 'dist/**'],
    languageOptions: {
      ecmaVersion: 2020,
      sourceType: 'module',
      parser: require('@typescript-eslint/parser'),
      parserOptions: {
        project: './tsconfig.json',
      },
    },
    plugins: {
      '@typescript-eslint': tsEslint,
    },
    ...tsEslint.configs.recommended,
    rules: {},
  },
];
