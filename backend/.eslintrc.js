module.exports = {
  env: {
    browser: true,
    es2021: true,
  },
  extends: [
    'airbnb-base',
  ],
  parserOptions: {
    ecmaVersion: 12,
    sourceType: 'module',
  },
  rules: {
    'linebreak-style': ['error', 'windows'],
    'max-len': ['error', { code: 150 }],
    'no-console': 'off',
    'no-use-before-define': 'off',
  },
};
