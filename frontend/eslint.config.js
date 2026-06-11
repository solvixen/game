import globals from 'globals'
import pluginVue from 'eslint-plugin-vue'
import prettierConfig from '@vue/eslint-config-prettier'

export default [
  // 全局忽略
  { ignores: ['dist/**', 'node_modules/**'] },

  // 基础 JS/TS 配置
  {
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        ...globals.browser,
        ...globals.node,
        ...globals.es2022
      }
    },
    rules: {
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      'no-console': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
      'no-debugger': process.env.NODE_ENV === 'production' ? 'error' : 'off'
    }
  },

  // Vue 文件
  ...pluginVue.configs['flat/recommended'],
  {
    rules: {
      'vue/multi-word-component-names': 'off',
      'vue/no-v-html': 'warn'
    }
  },

  // Prettier 整合
  prettierConfig,

  // .vue 文件处理
  {
    files: ['**/*.vue'],
    languageOptions: {
      parserOptions: {
        parser: { ts: false, js: true }
      }
    }
  }
]
