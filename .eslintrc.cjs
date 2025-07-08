module.exports = {
  env: {
    browser: true,
    es2021: true
  },
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    project: 'tsconfig.json'
  },
  extends: 'standard-with-typescript',
  plugins: ['@typescript-eslint'],
  overrides: [
  ],
  rules: {
    'no-multi-spaces': 'off',
    'no-eval': 'off'
  }
}
