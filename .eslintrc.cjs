module.exports = {
  root: true,
  env: {
    browser: true,
    es2022: true,
    node: true
  },
  extends: [
    'eslint:recommended',
    'plugin:vue/vue3-recommended',
    'plugin:@typescript-eslint/recommended'
  ],
  parser: 'vue-eslint-parser',
  parserOptions: {
    parser: '@typescript-eslint/parser',
    ecmaVersion: 'latest',
    sourceType: 'module'
  },
  plugins: ['vue', '@typescript-eslint'],
  rules: {
    // 关闭 any 警告（初期可放宽，后续逐步收紧）
    '@typescript-eslint/no-explicit-any': 'off',
    // 未使用变量警告
    '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
    // 组件名多单词
    'vue/multi-word-component-names': 'off',
    // 禁止使用 var
    'no-var': 'error',
    // 优先使用 const
    'prefer-const': 'warn'
  }
}
