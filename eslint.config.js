/**
 * ESLint Flat Config設定 - Rimorプロジェクト命名規則対応
 * v9.0 - 2025年9月19日
 * 
 * 命名規則ガイドライン（docs/NAMING_CONVENTIONS.md）に基づく
 * 自動検証ルール設定 - ESLint v9 Flat Config対応
 */

import js from '@eslint/js';
import tseslint from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import unicorn from 'eslint-plugin-unicorn';

export default [
  // JavaScript推奨設定
  js.configs.recommended,
  
  // TypeScriptファイル用設定
  {
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 2022,
        sourceType: 'module',
        project: './tsconfig.json',
      },
      globals: {
        // Node.js環境
        ...globalThis.console && { console: 'readonly' },
        Buffer: 'readonly',
        process: 'readonly',
        global: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        // Jest環境
        describe: 'readonly',
        test: 'readonly',
        it: 'readonly',
        expect: 'readonly',
        beforeEach: 'readonly',
        afterEach: 'readonly',
        beforeAll: 'readonly',
        afterAll: 'readonly',
        jest: 'readonly',
      }
    },
    plugins: {
      '@typescript-eslint': tseslint,
      'unicorn': unicorn,
    },
    rules: {
      // TypeScript推奨ルール
      ...tseslint.configs.recommended.rules,
      ...tseslint.configs['recommended-requiring-type-checking'].rules,
      
      // 命名規則違反の検出（DRY原則適用）
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

      // クラス・インターフェース命名規則（SOLID原則適用）
      '@typescript-eslint/naming-convention': [
        'error',
        // クラス名はPascalCase（Implサフィックス禁止）
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

      // TypeScript品質ルール（Defensive Programming原則）
      '@typescript-eslint/no-unused-vars': 'error',
      '@typescript-eslint/explicit-function-return-type': 'warn',
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/prefer-readonly': 'error',
      '@typescript-eslint/no-floating-promises': 'error',

      // プロジェクト固有のルール（KISS原則）
      'no-console': 'warn',
      'prefer-const': 'error',
      'no-var': 'error'
    }
  },

  // プラグインファイル専用ルール（単一責任原則）
  {
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

  // テストファイル専用ルール（YAGNI原則 - 必要最小限の制約）
  {
    files: ['**/*.test.ts', '**/*.spec.ts'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      'no-console': 'off'
    }
  },

  // 型定義ファイル専用ルール
  {
    files: ['src/types/**/*.ts'],
    rules: {
      '@typescript-eslint/no-empty-interface': 'off'
    }
  },

  // 除外設定（Defensive Programming - セキュリティ考慮）
  {
    ignores: [
      'dist/',
      'node_modules/',
      '*.js',
      '*.d.ts',
      'coverage/',
      '.rimor/',
      'temp/',
      'docs/api/',
      '.jest-cache/',
      '.cache/'
    ]
  }
];