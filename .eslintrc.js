module.exports = {
  'env': {
    'es6': true,
    'node': true
  },
  'extends': 'standard',
  'globals': {
    'Atomics': 'readonly',
    'SharedArrayBuffer': 'readonly'
  },
  // 'parserOptions': {
  //   'ecmaVersion': 2018,
  //   'sourceType': 'module',
  //   'parser': 'babel-eslint'
  // },
  'rules': {
    'no-console': process.env.NODE_ENV === 'production' ? 'error' : 'off',
    'no-debugger': process.env.NODE_ENV === 'production' ? 'error' : 'off',
    'arrow-parens': [
      'error',
      'as-needed'
    ],
    'require-jsdoc': 'off',
    'space-before-function-paren': 'off',
    'semi': 'off',
    'comma-dangle': 'off',
    'object-curly-spacing': 'warn',
    'padded-blocks': 'off',
    'camelcase': 'warn',
    'object-property-newline': 'off',
    'indent': 'warn'
  }
}
