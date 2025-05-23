module.exports = {
  extends: ['./src/ambire-common/.eslintrc.js'],
  rules: {
    'import/extensions': 'off',
    'class-methods-use-this': 'off',
    'no-nested-ternary': 'off',
    'prefer-promise-reject-errors': 'off',
    'no-underscore-dangle': 'off',
    'react/jsx-key': 'error'
  },
  env: {
    browser: true,
    node: true,
    jest: true
  },
  parserOptions: {
    project: './tsconfig.json'
  },
  globals: {
    process: 'readonly',
    chrome: 'readonly',
    injectWeb3: 'readonly',
    browser: 'readonly',
    __dirname: 'readonly',
    chromeTargetConfig: 'writable',
    firefoxTargetConfig: 'writable',
    Web3: true
  }
}
