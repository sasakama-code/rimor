import * as fs from 'fs';
import * as path from 'path';
import { LinterKnowledgeExtractor } from '../../../src/dictionary/extractors/linter';
import { ExtractedKnowledge, LearningOptions } from '../../../src/core/types';

// テスト用ファイルのパス
const testFilesDir = path.join(__dirname, '../../fixtures/dictionary');

describe('LinterKnowledgeExtractor', () => {
  beforeAll(() => {
    // テストディレクトリの作成
    if (!fs.existsSync(testFilesDir)) {
      fs.mkdirSync(testFilesDir, { recursive: true });
    }
  });

  afterAll(() => {
    // テストファイルのクリーンアップ
    if (fs.existsSync(testFilesDir)) {
      fs.rmSync(testFilesDir, { recursive: true });
    }
  });

  describe('ESLint設定からの抽出', () => {
    const eslintConfigPath = path.join(testFilesDir, '.eslintrc.json');

    beforeEach(() => {
      // テスト用ESLint設定ファイルの作成
      const eslintConfig: {
        extends: string[];
        plugins: string[];
        rules: { [key: string]: string };
        env: { [key: string]: boolean };
      } = {
        extends: [
          'eslint:recommended',
          '@typescript-eslint/recommended',
          'plugin:react/recommended'
        ],
        plugins: [
          '@typescript-eslint',
          'react',
          'react-hooks'
        ],
        rules: {
          'no-console': 'error',
          'prefer-const': 'warn',
          'no-unused-vars': 'off',
          '@typescript-eslint/no-unused-vars': 'error',
          'react/prop-types': 'off'
        },
        env: {
          browser: true,
          node: true,
          es6: true
        }
      };

      fs.writeFileSync(eslintConfigPath, JSON.stringify(eslintConfig, null, 2));
    });

    afterEach(() => {
      if (fs.existsSync(eslintConfigPath)) {
        fs.unlinkSync(eslintConfigPath);
      }
    });

    test('ESLint設定から知識を抽出', async () => {
      const knowledge = await LinterKnowledgeExtractor.extractFromESLint(eslintConfigPath);

      expect(knowledge).toBeDefined();
      expect(knowledge.confidence).toBeGreaterThan(0);
      expect(knowledge.terms.length).toBeGreaterThan(0);
      expect(knowledge.rules.length).toBeGreaterThan(0);

      // TypeScriptフレームワークが検出されることを確認
      const typescriptTerm = knowledge.terms.find(term => term.term.includes('TypeScript'));
      expect(typescriptTerm).toBeDefined();

      // Reactフレームワークが検出されることを確認
      const reactTerm = knowledge.terms.find(term => term.term.includes('React'));
      expect(reactTerm).toBeDefined();

      // ルールが推論されることを確認
      const noConsoleRule = knowledge.rules.find(rule => rule.name.includes('no-console'));
      expect(noConsoleRule).toBeDefined();
      expect(noConsoleRule?.confidence).toBeGreaterThan(0.8); // errorルールは高信頼度
    });

    test('ESLintプラグインからの用語抽出', async () => {
      const knowledge = await LinterKnowledgeExtractor.extractFromESLint(eslintConfigPath);

      // プラグインから用語が抽出されることを確認
      const pluginTerms = knowledge.terms.filter(term => term.term.includes('ESLint'));
      expect(pluginTerms.length).toBeGreaterThan(0);

      // 各用語が適切な構造を持つことを確認
      pluginTerms.forEach(term => {
        expect(term.id).toBeDefined();
        expect(term.term).toBeDefined();
        expect(term.definition).toBeDefined();
        expect(term.category).toBe('technical');
        expect(term.examples.length).toBeGreaterThan(0);
      });
    });

    test('ESLintルールからのパターン生成', async () => {
      const knowledge = await LinterKnowledgeExtractor.extractFromESLint(eslintConfigPath);

      // パターンが生成されることを確認
      expect(knowledge.patterns.length).toBeGreaterThan(0);

      // no-consoleパターンの確認
      const consolePattern = knowledge.patterns.find(pattern => 
        pattern.name.includes('no-console')
      );
      expect(consolePattern).toBeDefined();
      expect(consolePattern?.pattern).toContain('console');
    });

    test('存在しないファイルでのエラーハンドリング', async () => {
      const nonExistentPath = path.join(testFilesDir, 'non-existent.json');
      const knowledge = await LinterKnowledgeExtractor.extractFromESLint(nonExistentPath);

      // エラーハンドリングで空の知識オブジェクトが返されることを確認
      expect(knowledge.terms.length).toBe(0);
      expect(knowledge.rules.length).toBe(0);
      expect(knowledge.patterns.length).toBe(0);
      expect(knowledge.confidence).toBe(0);
    });

    test('JS形式のESLint設定ファイル', async () => {
      const jsConfigPath = path.join(testFilesDir, '.eslintrc.js');
      const jsConfig = `
module.exports = {
  extends: ['eslint:recommended'],
  rules: {
    'no-console': 'error'
  }
};
      `;

      fs.writeFileSync(jsConfigPath, jsConfig);

      const knowledge = await LinterKnowledgeExtractor.extractFromESLint(jsConfigPath);

      expect(knowledge.rules.length).toBeGreaterThan(0);

      // クリーンアップ
      fs.unlinkSync(jsConfigPath);
    });
  });

  describe('TypeScript設定からの抽出', () => {
    const tsconfigPath = path.join(testFilesDir, 'tsconfig.json');

    beforeEach(() => {
      // テスト用tsconfig.jsonの作成
      const tsconfig: {
        compilerOptions: { [key: string]: any };
        include: string[];
        exclude: string[];
      } = {
        compilerOptions: {
          target: 'ES2020',
          lib: ['ES2020', 'DOM'],
          module: 'commonjs',
          strict: true,
          esModuleInterop: true,
          skipLibCheck: true,
          forceConsistentCasingInFileNames: true
        },
        include: ['src/**/*'],
        exclude: ['node_modules', 'dist']
      };

      fs.writeFileSync(tsconfigPath, JSON.stringify(tsconfig, null, 2));
    });

    afterEach(() => {
      if (fs.existsSync(tsconfigPath)) {
        fs.unlinkSync(tsconfigPath);
      }
    });

    test('TypeScript設定から知識を抽出', async () => {
      const knowledge = await LinterKnowledgeExtractor.extractFromTypeScript(tsconfigPath);

      expect(knowledge.confidence).toBeGreaterThan(0.7);
      expect(knowledge.terms.length).toBeGreaterThan(0);

      // ターゲット用語の確認
      const targetTerm = knowledge.terms.find(term => term.term.includes('ES2020'));
      expect(targetTerm).toBeDefined();
      expect(targetTerm?.category).toBe('technical');

      // ライブラリ用語の確認
      const libTerms = knowledge.terms.filter(term => 
        term.term.includes('TypeScript ES2020') || term.term.includes('TypeScript DOM')
      );
      expect(libTerms.length).toBeGreaterThan(0);
    });

    test('strictモードからのルール推論', async () => {
      const knowledge = await LinterKnowledgeExtractor.extractFromTypeScript(tsconfigPath);

      // strictモードのルールが推論されることを確認
      const strictRule = knowledge.rules.find(rule => 
        rule.name.includes('Strict')
      );
      expect(strictRule).toBeDefined();
      expect(strictRule?.confidence).toBeGreaterThan(0.8);
    });

    test('コメント付きtsconfig.jsonの処理', async () => {
      const commentedTsconfig = `{
  // TypeScript configuration
  "compilerOptions": {
    "target": "ES2020", // Target ES2020
    "strict": true /* Enable strict mode */
  }
}`;

      fs.writeFileSync(tsconfigPath, commentedTsconfig);

      const knowledge = await LinterKnowledgeExtractor.extractFromTypeScript(tsconfigPath);

      expect(knowledge.terms.length).toBeGreaterThan(0);
    });
  });

  describe('Prettier設定からの抽出', () => {
    const prettierConfigPath = path.join(testFilesDir, '.prettierrc');

    beforeEach(() => {
      const prettierConfig: {
        semi: boolean;
        singleQuote: boolean;
        tabWidth: number;
        trailingComma: string;
        printWidth: number;
      } = {
        semi: false,
        singleQuote: true,
        tabWidth: 2,
        trailingComma: 'es5',
        printWidth: 80
      };

      fs.writeFileSync(prettierConfigPath, JSON.stringify(prettierConfig, null, 2));
    });

    afterEach(() => {
      if (fs.existsSync(prettierConfigPath)) {
        fs.unlinkSync(prettierConfigPath);
      }
    });

    test('Prettier設定から知識を抽出', async () => {
      const knowledge = await LinterKnowledgeExtractor.extractFromPrettier(prettierConfigPath);

      expect(knowledge.confidence).toBeGreaterThan(0);
      expect(knowledge.terms.length).toBeGreaterThan(0);
      expect(knowledge.rules.length).toBeGreaterThan(0);

      // Prettier設定から用語が抽出されることを確認
      const semiTerm = knowledge.terms.find(term => term.term.includes('semi'));
      expect(semiTerm).toBeDefined();
      expect(semiTerm?.category).toBe('technical');

      // フォーマットルールが推論されることを確認
      const semiRule = knowledge.rules.find(rule => rule.name.includes('semi'));
      expect(semiRule).toBeDefined();
    });
  });

  describe('統合的な知識抽出', () => {
    const eslintPath = path.join(testFilesDir, '.eslintrc.json');
    const tsconfigPath = path.join(testFilesDir, 'tsconfig.json');
    const prettierPath = path.join(testFilesDir, '.prettierrc');

    beforeEach(() => {
      // 複数の設定ファイルを作成
      const eslintConfig: { extends: string[]; rules: { [key: string]: string } } = {
        extends: ['@typescript-eslint/recommended'],
        rules: { 'no-console': 'error' }
      };

      const tsconfigData: { compilerOptions: { [key: string]: any } } = {
        compilerOptions: { target: 'ES2020', strict: true }
      };

      const prettierData: { semi: boolean; singleQuote: boolean } = {
        semi: false,
        singleQuote: true
      };

      fs.writeFileSync(eslintPath, JSON.stringify(eslintConfig));
      fs.writeFileSync(tsconfigPath, JSON.stringify(tsconfigData));
      fs.writeFileSync(prettierPath, JSON.stringify(prettierData));
    });

    afterEach(() => {
      [eslintPath, tsconfigPath, prettierPath].forEach(filePath => {
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      });
    });

    test('複数のLinter設定から統合抽出', async () => {
      const knowledge = await LinterKnowledgeExtractor.extractFromLinters({
        eslint: eslintPath,
        typescript: tsconfigPath,
        prettier: prettierPath
      });

      // 統合された知識の確認
      expect(knowledge.terms.length).toBeGreaterThan(0);
      expect(knowledge.rules.length).toBeGreaterThan(0);
      expect(knowledge.confidence).toBeGreaterThan(0);

      // 各ソースからの用語が含まれることを確認
      const hasESLintTerms = knowledge.terms.some(term => term.term.includes('TypeScript'));
      const hasTSTerms = knowledge.terms.some(term => term.term.includes('ES2020'));
      const hasPrettierTerms = knowledge.terms.some(term => term.term.includes('semi'));

      expect(hasESLintTerms).toBe(true);
      expect(hasTSTerms).toBe(true);
      expect(hasPrettierTerms).toBe(true);

      // 重複用語が除去されていることを確認
      const termIds = knowledge.terms.map(term => term.id);
      const uniqueIds = [...new Set(termIds)];
      expect(termIds.length).toBe(uniqueIds.length);
    });

    test('学習オプションの適用', async () => {
      const options: LearningOptions = {
        includeComments: false,
        includeTests: false,
        minFrequency: 2,
        maxTerms: 10
      };

      const knowledge = await LinterKnowledgeExtractor.extractFromLinters({
        eslint: eslintPath,
        typescript: tsconfigPath
      }, options);

      // maxTerms制限が適用されることを確認
      expect(knowledge.terms.length).toBeLessThanOrEqual(10);
    });
  });

  describe('設定ファイル自動検出', () => {
    const projectRoot = testFilesDir;

    beforeEach(() => {
      // 様々な設定ファイルを作成
      const emptyConfig: Record<string, never> = {};
      fs.writeFileSync(path.join(projectRoot, '.eslintrc.json'), JSON.stringify(emptyConfig));
      fs.writeFileSync(path.join(projectRoot, 'tsconfig.json'), JSON.stringify(emptyConfig));
      fs.writeFileSync(path.join(projectRoot, '.prettierrc'), JSON.stringify(emptyConfig));
    });

    afterEach(() => {
      const configFiles = [
        '.eslintrc.json',
        '.eslintrc.js',
        '.eslintrc.yml',
        'tsconfig.json',
        '.prettierrc',
        '.prettierrc.json'
      ];

      configFiles.forEach(file => {
        const filePath = path.join(projectRoot, file);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      });
    });

    test('設定ファイルの自動検出', async () => {
      const configs = await LinterKnowledgeExtractor.autoDetectConfigs(projectRoot);

      expect(configs.eslint).toBeDefined();
      expect(configs.typescript).toBeDefined();
      expect(configs.prettier).toBeDefined();

      expect(configs.eslint).toContain('.eslintrc.json');
      expect(configs.typescript).toContain('tsconfig.json');
      expect(configs.prettier).toContain('.prettierrc');
    });

    test('異なる形式の設定ファイル検出', async () => {
      // 既存ファイルを削除
      fs.unlinkSync(path.join(projectRoot, '.eslintrc.json'));
      fs.unlinkSync(path.join(projectRoot, '.prettierrc'));

      // 異なる形式のファイルを作成
      fs.writeFileSync(path.join(projectRoot, '.eslintrc.js'), 'module.exports = {};');
      const emptyConfig: Record<string, never> = {};
      fs.writeFileSync(path.join(projectRoot, '.prettierrc.json'), JSON.stringify(emptyConfig));

      const configs = await LinterKnowledgeExtractor.autoDetectConfigs(projectRoot);

      expect(configs.eslint).toContain('.eslintrc.js');
      expect(configs.prettier).toContain('.prettierrc.json');
    });

    test('設定ファイルが存在しない場合', async () => {
      const emptyDir = path.join(testFilesDir, 'empty');
      fs.mkdirSync(emptyDir);

      const configs = await LinterKnowledgeExtractor.autoDetectConfigs(emptyDir);

      expect(configs.eslint).toBeUndefined();
      expect(configs.typescript).toBeUndefined();
      expect(configs.prettier).toBeUndefined();

      // クリーンアップ
      fs.rmSync(emptyDir, { recursive: true });
    });
  });

  describe('エラーハンドリング', () => {
    test('破損したJSONファイルの処理', async () => {
      const brokenJsonPath = path.join(testFilesDir, 'broken.json');
      fs.writeFileSync(brokenJsonPath, '{ invalid json');

      const knowledge = await LinterKnowledgeExtractor.extractFromESLint(brokenJsonPath);

      // エラーが適切にハンドリングされ、空の知識オブジェクトが返される
      expect(knowledge.terms.length).toBe(0);
      expect(knowledge.confidence).toBe(0);

      // クリーンアップ
      fs.unlinkSync(brokenJsonPath);
    });

    test('読み取り権限のないファイル', async () => {
      const restrictedPath = path.join(testFilesDir, 'restricted.json');
      const emptyConfig: Record<string, never> = {};
      fs.writeFileSync(restrictedPath, JSON.stringify(emptyConfig));
      
      // 権限を変更（Unix系システムでのみ）
      if (process.platform !== 'win32') {
        fs.chmodSync(restrictedPath, 0o000);
      }

      const knowledge = await LinterKnowledgeExtractor.extractFromESLint(restrictedPath);

      // エラーハンドリングの確認
      expect(knowledge.confidence).toBe(0);

      // クリーンアップ
      if (process.platform !== 'win32') {
        fs.chmodSync(restrictedPath, 0o644);
      }
      fs.unlinkSync(restrictedPath);
    });
  });

  describe('パフォーマンス', () => {
    test('大きな設定ファイルの処理性能', async () => {
      const largeConfigPath = path.join(testFilesDir, 'large-eslintrc.json');
      
      // 大きな設定ファイルを生成
      const largeConfig: {
        extends: string[];
        plugins: string[];
        rules: { [key: string]: string };
      } = {
        extends: Array(100).fill('eslint:recommended'),
        plugins: Array(50).fill('test-plugin'),
        rules: {}
      };

      // 多数のルールを追加
      for (let i = 0; i < 1000; i++) {
        largeConfig.rules[`rule-${i}`] = 'error';
      }

      fs.writeFileSync(largeConfigPath, JSON.stringify(largeConfig));

      const startTime = Date.now();
      const knowledge = await LinterKnowledgeExtractor.extractFromESLint(largeConfigPath);
      const endTime = Date.now();

      // 処理時間が妥当であることを確認（5秒以内）
      expect(endTime - startTime).toBeLessThan(5000);
      expect(knowledge.terms.length).toBeGreaterThan(0);

      // クリーンアップ
      fs.unlinkSync(largeConfigPath);
    });
  });
});