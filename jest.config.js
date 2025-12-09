module.exports = {
  preset: 'jest-expo',
  testMatch: ['**/__tests__/**/*.(test|spec).[jt]s?(x)', '**/?(*.)+(test|spec).[tj]s?(x)'],
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native|react-clone-referenced-element|@react-navigation|expo(nent)?|@expo|expo-modules-core|@expo-google-fonts|react-native-svg|@unimodules|unimodules-|sentry-expo|native-base|react-native-gesture-handler)/)'
  ],
};
