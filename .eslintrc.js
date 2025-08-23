/**
 * ESLint設定 - Rimorプロジェクト命名規則対応
 * v1.0 - 2025年8月20日
 * 
 * 命名規則ガイドライン（docs/NAMING_CONVENTIONS.md）に基づく
 * 自動検証ルール設定
 */

module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
    project: './tsconfig.json',
  },
  plugins: [
    '@typescript-eslint',
    'unicorn'
  ],
  extends: [
    'eslint:recommended',
    '@typescript-eslint/recommended',
    '@typescript-eslint/recommended-requiring-type-checking'
  ],
  rules: {
    // 命名規則違反の検出
    'unicorn/filename-case': [
      'error',
      {
        cases: {
          camelCase: true,
          pascalCase: true
        },
        ignore: [
          // 例外パターン
          /^.*\.d\.ts$/,  // TypeScript型定義ファイル
          /^.*\.config\.[jt]s$/,  // 設定ファイル
          /^.*\.test\.[jt]s$/,    // テストファイル
          /^.*\.spec\.[jt]s$/     // specファイル
        ]
      }
    ],

    // バージョン番号付きファイル名の検出
    'unicorn/filename-case': [
      'error',
      {
        cases: {
          camelCase: true,
          pascalCase: true
        }
      }
    ],

    // クラス命名規則
    '@typescript-eslint/naming-convention': [
      'error',
      // クラス名はPascalCase
      {
        selector: 'class',
        format: ['PascalCase'],
        custom: {
          regex: '^(?!.*Impl$).*$',
          match: true
        }
      },
      // インターフェース名は I プレフィックス + PascalCase
      {
        selector: 'interface',
        format: ['PascalCase'],
        prefix: ['I']
      },
      // 変数名はcamelCase
      {
        selector: 'variable',
        format: ['camelCase', 'UPPER_CASE']
      },
      // 関数名はcamelCase
      {
        selector: 'function',
        format: ['camelCase']
      },
      // メソッド名はcamelCase
      {
        selector: 'method',
        format: ['camelCase']
      },
      // プロパティ名はcamelCase
      {
        selector: 'property',
        format: ['camelCase', 'UPPER_CASE']
      },
      // 型名はPascalCase
      {
        selector: 'typeLike',
        format: ['PascalCase']
      },
      // enum名はPascalCase
      {
        selector: 'enum',
        format: ['PascalCase']
      },
      // enumメンバーはUPPER_CASE
      {
        selector: 'enumMember',
        format: ['UPPER_CASE']
      }
    ],

    // その他の品質ルール
    '@typescript-eslint/no-unused-vars': 'error',
    '@typescript-eslint/explicit-function-return-type': 'warn',
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/prefer-readonly': 'error',
    '@typescript-eslint/no-floating-promises': 'error',

    // プロジェクト固有のルール
    'no-console': 'warn',
    'prefer-const': 'error',
    'no-var': 'error'
  },

  // カスタムルール（Rimorプロジェクト専用）
  overrides: [
    {
      // プラグインファイル専用ルール
      files: ['src/plugins/**/*.ts'],
      rules: {
        '@typescript-eslint/naming-convention': [
          'error',
          {
            selector: 'class',
            format: ['PascalCase'],
            suffix: ['Plugin']
          }
        ]
      }
    },
    {
      // テストファイル専用ルール
      files: ['**/*.test.ts', '**/*.spec.ts'],
      rules: {
        '@typescript-eslint/no-explicit-any': 'off',
        'no-console': 'off'
      }
    },
    {
      // 型定義ファイル専用ルール
      files: ['src/types/**/*.ts'],
      rules: {
        '@typescript-eslint/no-empty-interface': 'off'
      }
    }
  ],

  env: {
    node: true,
    es2022: true,
    jest: true
  },

  ignorePatterns: [
    'dist/',
    'node_modules/',
    '*.js',
    '*.d.ts'
  ]
};