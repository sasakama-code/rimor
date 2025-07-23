import { InteractiveCreator } from '../../src/interactive/creator';
import { SessionStep, Pattern } from '../../src/interactive/types';
import * as fs from 'fs';
import * as path from 'path';

describe('InteractiveCreator Integration Tests', () => {
  let creator: InteractiveCreator;
  let tempDir: string;

  beforeEach(() => {
    creator = new InteractiveCreator();
    tempDir = path.join(__dirname, '../../temp');
    
    // テスト用一時ディレクトリの作成
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
  });

  afterEach(() => {
    // テスト用一時ファイルのクリーンアップ
    if (fs.existsSync(tempDir)) {
      try {
        const files = fs.readdirSync(tempDir);
        for (const file of files) {
          fs.unlinkSync(path.join(tempDir, file));
        }
        fs.rmdirSync(tempDir);
      } catch (error) {
        // クリーンアップエラーは無視
      }
    }
  });

  describe('Full Interactive Flow', () => {
    it('should complete end-to-end plugin creation workflow', async () => {
      // Step 1: セッション開始
      const session = await creator.startSession();
      expect(session.id).toBeDefined();
      expect(session.currentStep).toBe(SessionStep.PURPOSE);

      // Step 2: 目的入力
      let nextStep = await creator.processInput(session, 'テストでアサーションの存在を確認したい');
      expect(session.collectedData.purpose).toBe('テストでアサーションの存在を確認したい');
      expect(nextStep.action).toBe('continue');
      expect(nextStep.step).toBe(SessionStep.PREVENTION_GOAL);

      // Step 3: 防止目標入力
      nextStep = await creator.processInput(session, 'テストでアサーションが忘れられることを防ぎたい');
      expect(session.collectedData.preventionGoal).toBe('テストでアサーションが忘れられることを防ぎたい');
      expect(nextStep.action).toBe('continue');
      expect(nextStep.step).toBe(SessionStep.GOOD_EXAMPLES);

      // Step 4: 良い例入力
      nextStep = await creator.processInput(session, 'expect(result).toBe(true);');
      expect(session.collectedData.goodExamples).toEqual(['expect(result).toBe(true);']);
      expect(nextStep.action).toBe('continue');
      expect(nextStep.step).toBe(SessionStep.BAD_EXAMPLES);

      // Step 5: 悪い例入力
      nextStep = await creator.processInput(session, 'result;');
      expect(session.collectedData.badExamples).toEqual(['result;']);
      expect(nextStep.action).toBe('generate');
      expect(nextStep.step).toBe(SessionStep.GENERATE);

      // Step 6: パターン分析の確認
      expect(session.collectedData.patterns).toBeDefined();
      expect(session.collectedData.patterns!.length).toBeGreaterThan(0);
      
      const expectPattern = session.collectedData.patterns!.find(p => p.value === 'expect(');
      expect(expectPattern).toBeDefined();
      expect(expectPattern!.confidence).toBeGreaterThan(0);

      // Step 7: プラグイン生成
      const plugin = await creator.generatePlugin(
        session.collectedData.patterns!,
        {
          name: 'test-assertion-plugin',
          description: 'テストアサーションチェック'
        }
      );

      expect(plugin.code).toContain('class TestAssertionPlugin');
      expect(plugin.code).toContain('implements IPlugin');
      expect(plugin.code).toContain('expect(');
      expect(plugin.metadata.name).toBe('test-assertion-plugin');
      expect(plugin.metadata.createdBy).toBe('interactive');

      // Step 8: プラグイン検証
      const testFile = path.join(tempDir, 'sample.test.js');
      fs.writeFileSync(testFile, 'expect(result).toBe(true);');

      const validation = await creator.validatePlugin(plugin, [testFile]);
      expect(validation.isValid).toBe(true);
      expect(validation.filesAnalyzed).toBe(1);
      // CI環境では実行時間が0になる可能性があるため、0以上で検証
      expect(validation.executionTime).toBeGreaterThanOrEqual(0);
    });

    it('should handle skip inputs correctly', async () => {
      const session = await creator.startSession();
      
      // 必須項目の入力
      await creator.processInput(session, 'テスト品質チェック');
      await creator.processInput(session, 'バグの防止');
      
      // 良い例をスキップ
      let nextStep = await creator.processInput(session, 'skip');
      expect(session.collectedData.goodExamples).toBeUndefined();
      expect(nextStep.step).toBe(SessionStep.BAD_EXAMPLES);
      
      // 悪い例もスキップ
      nextStep = await creator.processInput(session, 'skip');
      expect(session.collectedData.badExamples).toBeUndefined();
      expect(nextStep.action).toBe('generate');
      
      // パターンは空になる
      expect(session.collectedData.patterns).toEqual([]);
    });

    it('should validate plugin with different file scenarios', async () => {
      const patterns: Pattern[] = [{
        type: 'string-match',
        value: 'expect(',
        description: 'アサーション',
        confidence: 0.8
      }];

      const plugin = await creator.generatePlugin(patterns, {
        name: 'validation-test-plugin',
        description: 'バリデーションテスト'
      });

      // シナリオ1: expectが含まれるファイル（問題なし）
      const goodFile = path.join(tempDir, 'good.test.js');
      fs.writeFileSync(goodFile, 'test("should work", () => { expect(result).toBe(true); });');

      const goodValidation = await creator.validatePlugin(plugin, [goodFile]);
      expect(goodValidation.isValid).toBe(true);
      expect(goodValidation.issuesFound).toBe(0);

      // シナリオ2: expectが含まれないファイル（問題あり）
      const badFile = path.join(tempDir, 'bad.test.js');
      fs.writeFileSync(badFile, 'test("should work", () => { result === true; });');

      const badValidation = await creator.validatePlugin(plugin, [badFile]);
      expect(badValidation.isValid).toBe(true);
      expect(badValidation.issuesFound).toBeGreaterThan(0);

      // シナリオ3: 複数ファイル
      const mixedValidation = await creator.validatePlugin(plugin, [goodFile, badFile]);
      expect(mixedValidation.isValid).toBe(true);
      expect(mixedValidation.filesAnalyzed).toBe(2);
      expect(mixedValidation.issuesFound).toBe(1);
    });
  });

  describe('Pattern Analysis Integration', () => {
    it('should analyze real Jest test patterns correctly', async () => {
      const goodExamples = [
        `describe('Calculator', () => {
          it('should add numbers', () => {
            expect(calculator.add(1, 2)).toBe(3);
          });
        });`,
        `test('should multiply', () => {
          const result = calculator.multiply(2, 3);
          expect(result).toEqual(6);
        });`
      ];

      const badExamples = [
        `describe('Calculator', () => {
          it('should add numbers', () => {
            calculator.add(1, 2) === 3; // No assertion
          });
        });`,
        `test('should multiply', () => {
          const result = calculator.multiply(2, 3);
          console.log(result); // No assertion
        });`
      ];

      const patterns = await creator.analyzeSamples(goodExamples, badExamples);
      
      expect(patterns.length).toBeGreaterThanOrEqual(2);
      
      const expectPattern = patterns.find(p => p.value === 'expect(');
      const describePattern = patterns.find(p => p.value === 'describe(');
      
      expect(expectPattern).toBeDefined();
      expect(expectPattern!.confidence).toBeGreaterThan(0.5);
      
      expect(describePattern).toBeDefined();
      expect(describePattern!.confidence).toBeGreaterThan(0.1); // describeは悪い例にも含まれるため信頼度が低い
    });

    it('should handle edge cases in pattern analysis', async () => {
      // エッジケース: 同じパターンが good と bad の両方にある場合
      const goodExamples = ['expect(a).toBe(1); // proper assertion'];
      const badExamples = ['expect(a); // incomplete assertion'];

      const patterns = await creator.analyzeSamples(goodExamples, badExamples);
      
      // expect( パターンの信頼度が下がることを確認
      const expectPattern = patterns.find(p => p.value === 'expect(');
      if (expectPattern) {
        expect(expectPattern.confidence).toBeLessThan(1.0);
      }
    });
  });

  describe('Plugin Generation Integration', () => {
    it('should generate syntactically correct TypeScript code', async () => {
      const patterns: Pattern[] = [
        {
          type: 'string-match',
          value: 'expect(',
          description: 'Jest expectation',
          confidence: 0.9
        },
        {
          type: 'string-match',
          value: '.toBe(',
          description: 'Exact match assertion',
          confidence: 0.7
        }
      ];

      const plugin = await creator.generatePlugin(patterns, {
        name: 'jest-assertion-check',
        description: 'Jest アサーションチェックプラグイン'
      });

      // 生成されたコードの構文チェック
      expect(plugin.code).toContain("import { IPlugin, Issue } from '../core/types';");
      expect(plugin.code).toContain('export class JestAssertionCheckPlugin implements IPlugin');
      expect(plugin.code).toContain("name = 'jest-assertion-check';");
      expect(plugin.code).toContain('async analyze(filePath: string): Promise<Issue[]>');
      expect(plugin.code).toContain("const content = await fs.readFile(filePath, 'utf-8');");
      expect(plugin.code).toContain('return issues;');
      
      // パターン特有のコードの確認
      expect(plugin.code).toContain("!content.includes('expect(')");
      expect(plugin.code).toContain("!content.includes('.toBe(')");
      expect(plugin.code).toContain('信頼度: 0.9');
      expect(plugin.code).toContain('信頼度: 0.7');
    });
  });

  describe('Error Handling Integration', () => {
    it('should handle malformed input gracefully', async () => {
      const session = await creator.startSession();

      // 空の入力
      const emptyResult = await creator.processInput(session, '');
      expect(emptyResult.action).toBe('error');

      // 非常に長い入力
      const longInput = 'a'.repeat(10000);
      const longResult = await creator.processInput(session, longInput);
      expect(longResult.action).toBe('continue');
      expect(session.collectedData.purpose).toBe(longInput);
    });

    it('should handle file system errors in validation', async () => {
      const plugin = await creator.generatePlugin([], {
        name: 'error-test-plugin',
        description: 'エラーテスト'
      });

      // 存在しないファイル
      const nonExistentFiles = ['/path/that/does/not/exist.test.js'];
      
      const validation = await creator.validatePlugin(plugin, nonExistentFiles);
      expect(validation.isValid).toBe(true);
      expect(validation.filesAnalyzed).toBe(0);
    });
  });
});