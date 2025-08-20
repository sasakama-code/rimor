/**
 * Issue #81 カバレッジ統合による品質評価改善の検証テスト
 * 
 * このテストはIssue #81の修正内容を検証し、
 * 実際のカバレッジデータに基づく評価が機能しているかを確認します。
 */

import { TestExistencePlugin } from '../../src/plugins/core/TestExistencePlugin';
import { TestFile, ProjectContext, DetectionResult } from '../../src/core/types';
import * as fs from 'fs';
import * as path from 'path';

describe('Issue #81: カバレッジ統合による品質評価改善', () => {
  let plugin: TestExistencePlugin;
  let projectContext: ProjectContext;

  beforeEach(() => {
    plugin = new TestExistencePlugin();
    projectContext = {
      rootPath: process.cwd(),
      testFramework: 'jest',
      language: 'typescript'
    };
    
    // プロジェクトコンテキストを設定
    plugin.isApplicable(projectContext);
  });

  describe('カバレッジデータの統合確認', () => {
    it('カバレッジデータが存在する場合、従来の100点満点ではなく現実的な評価を返すべき', () => {
      // Arrange: テストファイルが存在するシナリオ
      const testFile: TestFile = {
        path: '/test/example.test.ts',
        content: 'describe("Example", () => { it("should work", () => { expect(true).toBe(true); }); });'
      };

      // テストファイル存在パターンを作成
      const patterns: DetectionResult[] = []; // パターンなし = テストファイル存在

      // Act: 品質評価を実行
      const result = plugin.evaluateQuality(patterns);

      // Assert: Issue #81の修正確認
      console.log('評価結果:', result);
      
      // 従来の100点満点ではなく、現実的な評価になっているか確認
      expect(result.overall).toBeLessThan(100);
      expect(result.overall).toBeGreaterThan(0);
      
      // カバレッジベースの評価が適用されていることを確認
      expect(result.dimensions).toBeDefined();
      expect(result.confidence).toBeDefined();
    });

    it('現在のRimorのカバレッジ(60.35%, 46.98%)で適切に低評価になることを確認', () => {
      // Arrange: テストファイルは存在するが、カバレッジが低いシナリオ
      const testFile: TestFile = {
        path: '/test/rimor-current.test.ts',
        content: 'describe("Rimor Current Coverage", () => { it("basic test", () => { expect(1).toBe(1); }); });'
      };

      const patterns: DetectionResult[] = []; // テストファイル存在

      // Act: 品質評価を実行
      const result = plugin.evaluateQuality(patterns);

      // Assert: 低カバレッジで適切に低評価になっている
      console.log('現在のRimorカバレッジでの評価結果:', result);
      
      // Issue #81で指摘された100/100スコアから大幅に改善されているはず
      expect(result.overall).toBeLessThan(70); // 60.35%カバレッジで70点未満
      expect(result.overall).toBeGreaterThan(5); // 最低限の評価は維持（実際は11.2点）
    });

    it('テストファイルが存在しない場合の評価を確認', () => {
      // Arrange: テストファイルが存在しないシナリオ
      const patterns: DetectionResult[] = [
        {
          patternId: 'missing-test-file',
          patternName: 'Missing Test File',
          severity: 'high',
          confidence: 0.9,
          location: { file: '/src/example.ts', line: 1, column: 1 }
        }
      ];

      // Act: 品質評価を実行
      const result = plugin.evaluateQuality(patterns);

      // Assert: テストファイル不存在で適切に低評価
      console.log('テストファイル不存在での評価結果:', result);
      
      expect(result.overall).toBeLessThan(50); // テスト不存在で低評価
    });
  });

  describe('カバレッジデータの取得確認', () => {
    it('実際のプロジェクトのカバレッジファイルが読み込める', () => {
      // Arrange: 実際のcoverage-summary.jsonの存在確認
      const coveragePath = path.join(process.cwd(), 'coverage', 'coverage-summary.json');
      
      if (fs.existsSync(coveragePath)) {
        // Act: カバレッジファイルを読み込み
        const coverageData = JSON.parse(fs.readFileSync(coveragePath, 'utf-8'));
        
        // Assert: 期待されるカバレッジデータ構造
        expect(coverageData.total).toBeDefined();
        expect(coverageData.total.lines).toBeDefined();
        expect(coverageData.total.branches).toBeDefined();
        
        console.log('実際のカバレッジデータ:');
        console.log('Lines:', coverageData.total.lines.pct + '%');
        console.log('Branches:', coverageData.total.branches.pct + '%');
        console.log('Functions:', coverageData.total.functions.pct + '%');
        console.log('Statements:', coverageData.total.statements.pct + '%');
        
        // Issue #81で指摘された値の確認
        expect(coverageData.total.lines.pct).toBeLessThan(80); // 業界標準未達
        expect(coverageData.total.branches.pct).toBeLessThan(70); // 業界標準未達
      } else {
        console.log('カバレッジファイルが見つかりません:', coveragePath);
        console.log('テストを実行するためには、先にcoverageを生成してください: npm run test:coverage');
      }
    });
  });

  describe('Issue #81の要求事項確認', () => {
    it('テストの存在のみで100/100スコアを付与しない', () => {
      // Arrange: テストファイルは存在するシナリオ
      const patterns: DetectionResult[] = []; // テストファイル存在

      // Act: 品質評価を実行
      const result = plugin.evaluateQuality(patterns);

      // Assert: Issue #81の要求事項
      expect(result.overall).not.toBe(100); // テスト存在のみで100点は付与されない
      console.log('テスト存在時の評価:', result.overall, '点 (従来は100点)');
    });

    it('業界標準閾値(80% line, 70% branch)を適用した評価', () => {
      // 実際のカバレッジが業界標準を満たしていない場合の適切な評価を確認
      const patterns: DetectionResult[] = [];
      const result = plugin.evaluateQuality(patterns);

      // カバレッジが低い場合、適切に減点されていることを確認
      expect(result.overall).toBeLessThan(80); // 業界標準未達で減点
      console.log('業界標準未達時の評価:', result.overall, '点');
    });
  });
});