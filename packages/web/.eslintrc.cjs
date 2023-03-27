module.exports = {
  extends: ['@whalecloud/eslint-config/configurations/typescript', 'plugin:react-hooks/recommended'],
  plugins: ['react-refresh'],
  rules: {
    'no-console': 'warn',
    'react/react-in-jsx-scope': 'off',
    // Use function hoisting to improve code readability
    // 'no-use-before-define': ['off', { functions: false, classes: true, variables: true }],
    // Makes no sense to allow type inferrence for expression parameters, but require typing the response
    // '@typescript-eslint/no-use-before-define': ['off', { functions: false, classes: true, variables: true, typedefs: true }],
    'react-refresh/only-export-components': 'error',
    'react/no-unknown-property': ['error', { ignore: ['css'] }],
  },
};
