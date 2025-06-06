module.exports = {
  extends: [
    'next/core-web-vitals',
    'plugin:@typescript-eslint/recommended',
  ],
  plugins: ['@typescript-eslint'],
  rules: {
    // Prevent mock data
    'no-restricted-syntax': [
      'error',
      {
        selector: 'Literal[value=/mock/i]',
        message: 'Mock data is not allowed in production code. Use proper data fetching instead.',
      },
    ],
    // Enforce proper error handling
    'no-empty-catch': 'error',
    'no-console': ['error', { allow: ['warn', 'error'] }],
    // Enforce proper type checking
    '@typescript-eslint/no-explicit-any': 'error',
    '@typescript-eslint/explicit-function-return-type': 'error',
    // Enforce proper date handling
    'no-new-date': 'error',
    // Enforce proper null checks
    '@typescript-eslint/no-non-null-assertion': 'error',
    // Enforce proper async/await
    'no-return-await': 'error',
    'no-await-in-loop': 'error',
    // Enforce proper imports
    'import/no-duplicates': 'error',
    'import/order': ['error', {
      'groups': ['builtin', 'external', 'internal', 'parent', 'sibling', 'index'],
      'newlines-between': 'always',
      'alphabetize': { 'order': 'asc' }
    }],
    // Enforce proper React patterns
    'react-hooks/rules-of-hooks': 'error',
    'react-hooks/exhaustive-deps': 'error',
    'react/no-array-index-key': 'error',
    // Enforce proper accessibility
    'jsx-a11y/alt-text': 'error',
    'jsx-a11y/aria-props': 'error',
    'jsx-a11y/aria-role': 'error',
    'jsx-a11y/role-has-required-aria-props': 'error',
    'jsx-a11y/role-supports-aria-props': 'error',
  },
  overrides: [
    {
      files: ['**/*.test.ts', '**/*.test.tsx'],
      rules: {
        'no-restricted-syntax': 'off',
        '@typescript-eslint/no-explicit-any': 'off',
      },
    },
  ],
}; 