module.exports = {
    parser: '@typescript-eslint/parser',
    parserOptions: {
      project: 'tsconfig.json',
      sourceType: 'module',
    },
    plugins: ['@typescript-eslint/eslint-plugin'],
    extends: [
      "airbnb-typescript",
      'plugin:@typescript-eslint/recommended',
      "prettier",
      "plugin:prettier/recommended"
    ],
    root: true,
    env: {
      node: true,
      jest: true,
    },
    ignorePatterns: ['.eslintrc.js'],
    rules: {
      "import/prefer-default-export": 0,
      '@typescript-eslint/explicit-module-boundary-types': 0,
      "@typescript-eslint/no-unused-vars": [
        1,
        {
          "argsIgnorePattern": "^_"
        }
      ],
    },
  };