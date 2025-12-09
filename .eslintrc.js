module.exports = {
  root: true,
  extends: ['@react-native/eslint-config'],
  rules: {
    'react-native/no-inline-styles': 'off',
    'react-hooks/exhaustive-deps': 'warn',
    'react-hooks/rules-of-hooks': 'warn',
    'react/no-unstable-nested-components': 'off',
    'no-alert': 'off',
    'no-bitwise': 'off',
  },
  overrides: [
    {
      files: ['**/__tests__/**/*.{js,jsx,ts,tsx}', '**/?(*.)+(spec|test).{js,jsx,ts,tsx}'],
      env: {
        jest: true,
      },
    },
  ],
};
