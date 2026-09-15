// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ['dist/*'],
  },
  {
    // react-hooks/immutability (React Compiler rule) doesn't understand
    // react-native-reanimated's useSharedValue().value mutation — that's
    // the library's documented, safe usage pattern, not a real bug.
    rules: {
      'react-hooks/immutability': 'off',
    },
  },
]);
