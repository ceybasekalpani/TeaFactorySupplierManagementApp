// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ['dist/*', '.expo/**', 'app-example/**'],
  },
  {
    files: [
      'src/app/(app)/notifications.jsx',
      'src/components/SidebarMenu.jsx',
      'src/features/history/components/PeriodSelector.jsx',
    ],
    // Preserve the existing Animated.Value refs during the SDK migration.
    rules: { 'react-hooks/refs': 'warn' },
  },
  {
    files: [
      'hooks/use-color-scheme.web.ts',
      'src/components/SpecialNewsModal.jsx',
      'src/features/cash-request/CashRequestScreen.jsx',
      'src/features/supply-request/SupplyRequestScreen.jsx',
    ],
    // Existing hydration, modal, and form resets remain visible for later review.
    rules: { 'react-hooks/set-state-in-effect': 'warn' },
  },
]);
