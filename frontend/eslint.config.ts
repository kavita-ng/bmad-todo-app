import { globalIgnores } from 'eslint/config'
import { defineConfigWithVueTs, vueTsConfigs } from '@vue/eslint-config-typescript'
import pluginVue from 'eslint-plugin-vue'
import pluginVitest from '@vitest/eslint-plugin'
import pluginOxlint from 'eslint-plugin-oxlint'
import skipFormatting from 'eslint-config-prettier/flat'
import pluginVueA11y from 'eslint-plugin-vuejs-accessibility'

// To allow more languages other than `ts` in `.vue` files, uncomment the following lines:
// import { configureVueProject } from '@vue/eslint-config-typescript'
// configureVueProject({ scriptLangs: ['ts', 'tsx'] })
// More info at https://github.com/vuejs/eslint-config-typescript/#advanced-setup

export default defineConfigWithVueTs(
  {
    name: 'app/files-to-lint',
    files: ['**/*.{vue,ts,mts,tsx}'],
  },

  globalIgnores(['**/dist/**', '**/dist-ssr/**', '**/coverage/**']),

  ...pluginVue.configs['flat/essential'],
  ...pluginVueA11y.configs['flat/recommended'],
  // AC4: elevate all a11y rules from warn to error
  {
    files: ['**/*.vue'],
    rules: Object.fromEntries(
      (pluginVueA11y.configs['flat/recommended'] as Array<{ rules?: Record<string, unknown> }>)
        .flatMap((c) => Object.keys(c.rules ?? {}))
        .map((rule) => [rule, 'error']),
    ),
  },
  vueTsConfigs.recommended,

  {
    ...pluginVitest.configs.recommended,
    // Match both __tests__/ directories and *.spec.ts / *.test.ts naming conventions
    files: ['src/**/__tests__/**', 'src/**/*.{spec,test}.ts'],
  },

  ...pluginOxlint.buildFromOxlintConfigFile('.oxlintrc.json'),

  skipFormatting,
)
