/**
 * Phase 2 統合テスト
 * v0.9.0 - DomainInferenceEngine、BusinessLogicMapper、TestIntentExtractorの統合動作確認
 */

import * as path from 'path';
import { TestIntentExtractor } from '../../src/intent-analysis/TestIntentExtractor';
import { TreeSitterParser, SupportedLanguage } from '../../src/intent-analysis/TreeSitterParser';
import { TypeScriptAnalyzer } from '../../src/intent-analysis/TypeScriptAnalyzer';
import { DomainInferenceEngine } from '../../src/intent-analysis/DomainInferenceEngine';
import { BusinessLogicMapper } from '../../src/intent-analysis/BusinessLogicMapper';

describe('Phase 2 Integration Tests', () => {
  let extractor: TestIntentExtractor;
  let parser: TreeSitterParser;
  let tsAnalyzer: TypeScriptAnalyzer;
  let domainEngine: DomainInferenceEngine;
  let businessMapper: BusinessLogicMapper;

  beforeEach(() => {
    parser = TreeSitterParser.getInstance();
    tsAnalyzer = new TypeScriptAnalyzer();
    domainEngine = new DomainInferenceEngine();
    businessMapper = new BusinessLogicMapper();
    extractor = new TestIntentExtractor(parser);
  });

  describe('Rimorプロジェクト自体での統合テスト', () => {
    it('DomainInferenceEngineのテストファイルを分析できる', async () => {
      const testFilePath = path.join(__dirname, '../intent-analysis/DomainInferenceEngine.test.ts');
      const ast = await parser.parseFile(testFilePath);
      
      // テスト意図の抽出
      const intent = await extractor.extractIntent(testFilePath, ast);
      const actual = await extractor.analyzeActualTest(testFilePath, ast);
      const result = await extractor.evaluateRealization(intent, actual);

      expect(result.realizationScore).toBeGreaterThan(80);
      expect(result.riskLevel).toBe('minimal');
      expect(intent.description).toContain('Userクラスからユーザー管理ドメインを推論できる');
    });

    it('型情報を使用した高度な分析ができる', async () => {
      // TypeScriptAnalyzerの初期化
      await tsAnalyzer.initialize(path.join(__dirname, '../../tsconfig.json'));
      
      // PaymentService関連のテストを分析
      const testCode = `
        import { PaymentService } from '../src/services/PaymentService';
        
        describe('PaymentService', () => {
          it('should process payment', async () => {
            const service = new PaymentService();
            const payment = { amount: 1000, currency: 'JPY' };
            const result = await service.processPayment(payment);
            expect(result.status).toBe('success');
          });
        });
      `;

      const ast = parser.parseContent(testCode, SupportedLanguage.TYPESCRIPT);
      
      // 型情報のモック（実際のTypeScript APIは時間がかかるため）
      const typeInfo = new Map([
        ['service', { typeName: 'PaymentService', isPrimitive: false }],
        ['payment', { typeName: 'Payment', isPrimitive: false }]
      ]);

      // 高度な評価
      const intent = await extractor.extractIntent('test.ts', ast);
      const actual = await extractor.analyzeActualTest('test.ts', ast);
      const advancedResult = await (extractor as any).evaluateRealizationWithTypeInfo(
        intent,
        actual,
        typeInfo
      );

      expect(advancedResult.domainRelevance).toBeDefined();
      expect(advancedResult.domainRelevance.domain).toBe('payment');
    });

    it('ビジネスロジックマッピングの統合動作を確認できる', async () => {
      const testCode = `
        describe('TaxCalculator', () => {
          it('should calculate tax correctly', () => {
            const amount = 1000;
            const tax = calculateTax(amount, 'JP');
            expect(tax).toBe(100);
          });
        });
      `;

      const ast = parser.parseContent(testCode, SupportedLanguage.TYPESCRIPT);
      
      // 仮想的な呼び出しグラフ
      const callGraph = [
        {
          name: 'calculateTax',
          filePath: '/src/utils/TaxCalculator.ts',
          line: 10,
          calls: [
            {
              name: 'getTaxRate',
              filePath: '/src/utils/TaxRates.ts',
              line: 5,
              calls: [],
              calledBy: []
            }
          ],
          calledBy: []
        }
      ];

      const result = await (extractor as any).analyzeWithBusinessContext(
        'test.ts',
        ast,
        callGraph
      );

      expect(result.businessLogicCoverage.coveredFunctions).toContain('calculateTax');
    });
  });

  describe('パフォーマンステスト', () => {
    it('複数のテストファイルを高速に処理できる', async () => {
      const startTime = Date.now();
      const testFiles = [
        '../intent-analysis/DomainInferenceEngine.test.ts',
        '../intent-analysis/BusinessLogicMapper.test.ts',
        '../intent-analysis/TestIntentExtractor.test.ts'
      ];

      const results = [];
      for (const file of testFiles) {
        const testFilePath = path.join(__dirname, file);
        const ast = await parser.parseFile(testFilePath);
        const intent = await extractor.extractIntent(testFilePath, ast);
        const actual = await extractor.analyzeActualTest(testFilePath, ast);
        const result = await extractor.evaluateRealization(intent, actual);
        results.push(result);
      }

      const endTime = Date.now();
      const processingTime = endTime - startTime;

      // 3ファイルを1秒以内に処理
      expect(processingTime).toBeLessThan(1000);
      expect(results).toHaveLength(3);
      expect(results.every(r => r.realizationScore > 0)).toBe(true);
    });
  });

  describe('エンドツーエンドシナリオ', () => {
    it('Phase 2の全機能を組み合わせた分析ができる', async () => {
      // 1. ドメイン推論
      const userType = { typeName: 'User', isPrimitive: false };
      const domainInference = await domainEngine.inferDomainFromType(userType);
      expect(domainInference.domain).toBe('user-management');

      // 2. ビジネスロジックマッピング  
      const mockCallGraph = [
        {
          name: 'createUser',
          filePath: '/src/services/UserService.ts',
          line: 20,
          calls: [],
          calledBy: []
        }
      ];
      const mapping = await businessMapper.mapTestToBusinessLogic(
        'test.ts',
        mockCallGraph,
        new Map([['User', userType]])
      );
      // user-managementドメインは重要度highだが、関数が単純なのでlowと判定される
      expect(mapping.businessCriticality.level).toBe('low');
      expect(mapping.businessLogicFiles[0].domain.domain).toBe('user-management');
      expect(mapping.businessLogicFiles[0].domain.businessImportance).toBe('high');

      // 3. スマート提案生成
      const testCode = `
        describe('AuthService', () => {
          it('should authenticate user', () => {
            const result = authService.login('user', 'pass');
            expect(result).toBeDefined();
          });
        });
      `;
      const ast = parser.parseContent(testCode, SupportedLanguage.TYPESCRIPT);
      const suggestions = await (extractor as any).generateSmartSuggestions(
        'test.ts',
        ast,
        new Map([['authService', { typeName: 'AuthenticationService', isPrimitive: false }]])
      );

      expect(suggestions).toContainEqual(
        expect.objectContaining({
          type: 'security',
          priority: 'critical',
          description: expect.stringContaining('無効な認証情報')
        })
      );
    });
  });
});