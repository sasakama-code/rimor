import { DictionaryAwarePluginManager } from '../../src/core/DictionaryAwarePluginManager';
import { DomainTermCoveragePlugin } from '../../src/plugins/domain/DomainTermCoveragePlugin';
import { DomainTermManager } from '../../src/dictionary/core/term';
import { BusinessRuleManager } from '../../src/dictionary/core/rule';
import { DomainDictionary } from '../../src/core/types';
import * as fs from 'fs';
import * as path from 'path';

describe('Dictionary Plugin Integration', () => {
  let pluginManager: DictionaryAwarePluginManager;
  let testDictionary: DomainDictionary;
  let tempDir: string;

  beforeAll(() => {
    // テスト用一時ディレクトリの作成
    tempDir = path.join(__dirname, '../fixtures/integration');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
  });

  beforeEach(() => {
    pluginManager = new DictionaryAwarePluginManager();
    
    // テスト用辞書の作成
    testDictionary = {
      version: '1.0.0',
      domain: 'ecommerce',
      language: 'ja',
      lastUpdated: new Date(),
      terms: [
        DomainTermManager.createTerm({
          id: 'payment-term',
          term: 'Payment',
          definition: 'Payment processing functionality',
          category: 'financial',
          importance: 'critical',
          aliases: ['payment', 'pay'],
          examples: [{
            code: 'processPayment(amount, currency)',
            description: 'Process payment with amount and currency'
          }],
          relatedPatterns: ['payment.*', 'pay.*'],
          testRequirements: ['Payment validation test', 'Payment security test']
        }),
        DomainTermManager.createTerm({
          id: 'user-term',
          term: 'User',
          definition: 'System user functionality',
          category: 'core-business',
          importance: 'high',
          aliases: ['user', 'customer'],
          examples: [{
            code: 'createUser(userData)',
            description: 'Create a new user'
          }],
          relatedPatterns: ['user.*', 'customer.*'],
          testRequirements: ['User creation test', 'User validation test']
        })
      ],
      relationships: [],
      businessRules: [
        BusinessRuleManager.createRule({
          id: 'payment-validation-rule',
          name: 'Payment Validation Rule',
          description: 'All payment operations must be validated',
          domain: 'ecommerce',
          condition: {
            type: 'function-name',
            pattern: '.*[Pp]ayment.*',
            scope: 'function'
          },
          requirements: [{
            type: 'must-have',
            description: 'Amount validation test',
            testPattern: 'expect\\\\(.*amount.*\\\\)\\\\.toBe.*',
            example: 'expect(amount).toBeGreaterThan(0)'
          }],
          priority: 10
        })
      ],
      qualityStandards: [],
      contextMappings: []
    };
  });

  afterAll(() => {
    // テスト用ファイルのクリーンアップ
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true });
    }
  });

  describe('プラグイン登録とセットアップ', () => {
    test('辞書対応プラグインの登録', () => {
      const plugin = new DomainTermCoveragePlugin();
      
      pluginManager.registerDictionaryAwarePlugin(plugin);
      
      const registeredPlugins = pluginManager.getDictionaryAwarePlugins();
      expect(registeredPlugins).toHaveLength(1);
      expect(registeredPlugins[0].id).toBe('domain-term-coverage');
      expect(registeredPlugins[0].name).toBe('DomainTermCoverage');
    });

    test('ドメイン辞書の読み込み', async () => {
      // テスト用辞書ファイルの作成
      const dictionaryPath = path.join(tempDir, 'test-dictionary.yaml');
      const dictionaryYaml = `
version: "1.0.0"
domain: "ecommerce"
language: "ja"
lastUpdated: "${new Date().toISOString()}"
terms:
  - id: "payment-term"
    term: "Payment"
    definition: "Payment processing functionality"
    category: "financial"
    importance: "critical"
    aliases: ["payment", "pay"]
    examples:
      - code: "processPayment(amount, currency)"
        description: "Process payment with amount and currency"
    relatedPatterns: ["payment.*", "pay.*"]
    testRequirements: ["Payment validation test"]
relationships: []
businessRules: []
qualityStandards: []
contextMappings: []
      `.trim();
      
      fs.writeFileSync(dictionaryPath, dictionaryYaml, 'utf-8');
      
      const result = await pluginManager.loadDictionary(dictionaryPath, 'ecommerce');
      
      expect(result).toBe(true);
      
      const loadedDictionaries = pluginManager.getLoadedDictionaries();
      expect(loadedDictionaries).toHaveLength(1);
      expect(loadedDictionaries[0].domain).toBe('ecommerce');
      expect(loadedDictionaries[0].termsCount).toBe(1);
    });
  });

  describe('辞書対応プラグインの実行', () => {
    beforeEach(async () => {
      // プラグインと辞書のセットアップ
      const plugin = new DomainTermCoveragePlugin();
      pluginManager.registerDictionaryAwarePlugin(plugin);
      
      // 辞書をマネージャーに直接設定（テスト用）
      (pluginManager as any).loadedDictionaries.set('ecommerce', testDictionary);
      (pluginManager as any).dictionaryEnabled = true;
    });

    test('辞書対応プラグインによる文脈分析', async () => {
      // テスト用ファイルの作成
      const testFilePath = path.join(tempDir, 'payment.test.ts');
      const testFileContent = `
        import { PaymentService } from '../src/payment-service';
        
        describe('Payment Processing', () => {
          test('should process payment with valid amount', () => {
            const paymentService = new PaymentService();
            const result = paymentService.processPayment(100, 'USD');
            expect(result.success).toBe(true);
            expect(result.amount).toBeGreaterThan(0);
          });
          
          test('should validate user before payment', () => {
            const paymentService = new PaymentService();
            const user = { id: 1, isActive: true };
            const result = paymentService.validateUserForPayment(user);
            expect(result).toBe(true);
          });
        });
      `;
      
      fs.writeFileSync(testFilePath, testFileContent, 'utf-8');
      
      const result = await pluginManager.runDictionaryAwarePlugin(
        'domain-term-coverage',
        testFilePath,
        'ecommerce'
      );
      
      expect(result).not.toBeNull();
      expect(result!.context.filePath).toBe(testFilePath);
      expect(result!.context.language).toBe('typescript');
      expect(result!.relevantTerms.length).toBeGreaterThan(0);
      
      // Payment用語が検出されることを確認
      const paymentTerm = result!.relevantTerms.find(
        tr => tr.term.term === 'Payment'
      );
      expect(paymentTerm).toBeDefined();
    });

    test('ドメイン品質評価の実行', async () => {
      // テスト用ファイルの作成
      const testFilePath = path.join(tempDir, 'domain-quality.test.ts');
      const testFileContent = `
        describe('Domain Quality Test', () => {
          test('payment processing with user validation', () => {
            const payment = new PaymentProcessor();
            const user = createUser({ type: 'premium' });
            
            const result = payment.processUserPayment(user, 250.00);
            
            expect(result.payment.amount).toBe(250.00);
            expect(result.user.validated).toBe(true);
          });
        });
      `;
      
      fs.writeFileSync(testFilePath, testFileContent, 'utf-8');
      
      const result = await pluginManager.evaluateQualityWithDomain(
        testFilePath,
        'ecommerce'
      );
      
      expect(result.overallScore).toBeGreaterThan(0);
      expect(result.domainSpecificScores.size).toBeGreaterThan(0);
      expect(result.recommendations.length).toBeGreaterThan(0);
      
      // ドメイン固有のスコアが含まれることを確認
      const coverageScore = result.domainSpecificScores.get('domain-term-coverage');
      expect(coverageScore).toBeDefined();
      expect(coverageScore.overall).toBeGreaterThan(0);
    });

    test('すべてのプラグインの統合実行', async () => {
      // テスト用ファイルの作成
      const testFilePath = path.join(tempDir, 'integrated.test.ts');
      const testFileContent = `
        import { PaymentService } from '../payment-service';
        import { UserService } from '../user-service';
        
        describe('Integrated Payment and User Tests', () => {
          test('complete payment workflow', () => {
            const userService = new UserService();
            const paymentService = new PaymentService();
            
            const user = userService.createUser({
              email: 'test@example.com',
              type: 'premium'
            });
            
            const payment = paymentService.processPayment({
              amount: 199.99,
              currency: 'USD',
              userId: user.id
            });
            
            expect(user.isActive).toBe(true);
            expect(payment.amount).toBeGreaterThan(0);
            expect(payment.status).toBe('completed');
          });
        });
      `;
      
      fs.writeFileSync(testFilePath, testFileContent, 'utf-8');
      
      const results = await pluginManager.runAllWithDictionary(
        testFilePath,
        'ecommerce'
      );
      
      expect(results.legacyResults).toBeDefined();
      expect(results.contextualResults).toBeDefined();
      expect(results.pluginResults).toBeDefined();
      
      // 辞書対応の結果が含まれることを確認
      expect(results.contextualResults.length).toBeGreaterThan(0);
      
      const contextualResult = results.contextualResults[0];
      expect(contextualResult.context.filePath).toBe(testFilePath);
      expect(contextualResult.qualityScore).toBeGreaterThan(0);
    });
  });

  describe('エラーハンドリング', () => {
    test('存在しない辞書での実行', async () => {
      const plugin = new DomainTermCoveragePlugin();
      pluginManager.registerDictionaryAwarePlugin(plugin);
      
      const testFilePath = path.join(tempDir, 'error-test.ts');
      fs.writeFileSync(testFilePath, 'test content', 'utf-8');
      
      const result = await pluginManager.runDictionaryAwarePlugin(
        'domain-term-coverage',
        testFilePath,
        'nonexistent-domain'
      );
      
      expect(result).toBeNull();
    });

    test('存在しないプラグインの実行', async () => {
      (pluginManager as any).loadedDictionaries.set('test', testDictionary);
      
      const testFilePath = path.join(tempDir, 'error-test.ts');
      fs.writeFileSync(testFilePath, 'test content', 'utf-8');
      
      const result = await pluginManager.runDictionaryAwarePlugin(
        'nonexistent-plugin',
        testFilePath,
        'test'
      );
      
      expect(result).toBeNull();
    });

    test('不正なファイルパスでの実行', async () => {
      const plugin = new DomainTermCoveragePlugin();
      pluginManager.registerDictionaryAwarePlugin(plugin);
      (pluginManager as any).loadedDictionaries.set('test', testDictionary);
      
      const results = await pluginManager.runAllWithDictionary(
        '/invalid/path/test.ts',
        'test'
      );
      
      // エラーが適切にハンドリングされ、空の結果が返されることを確認
      expect(results.legacyResults).toEqual([]);
      expect(results.contextualResults).toEqual([]);
      expect(results.pluginResults).toEqual([]);
    });
  });

  describe('統計情報とステータス', () => {
    test('拡張統計情報の取得', () => {
      // プラグイン登録前の統計を確認
      const initialStats = pluginManager.getEnhancedStats();
      const initialTotalPlugins = initialStats.basic.totalPlugins;
      
      const plugin = new DomainTermCoveragePlugin();
      pluginManager.registerDictionaryAwarePlugin(plugin);
      (pluginManager as any).loadedDictionaries.set('test', testDictionary);
      
      const stats = pluginManager.getEnhancedStats();
      
      expect(stats.dictionaryAwarePlugins).toBe(1);
      expect(stats.loadedDictionaries).toBe(1);
      expect(stats.basic).toBeDefined();
      // プラグイン登録後、totalPluginsが増加していることを確認
      expect(stats.basic.totalPlugins).toBe(initialTotalPlugins + 1);
    });

    test('辞書機能の有効/無効切り替え', () => {
      pluginManager.setDictionaryEnabled(false);
      const stats = pluginManager.getEnhancedStats();
      expect(stats.dictionaryEnabled).toBe(false);
      
      pluginManager.setDictionaryEnabled(true);
      const statsEnabled = pluginManager.getEnhancedStats();
      expect(statsEnabled.dictionaryEnabled).toBe(true);
    });

    test('読み込み済み辞書の一覧表示', () => {
      (pluginManager as any).loadedDictionaries.set('ecommerce', testDictionary);
      (pluginManager as any).loadedDictionaries.set('financial', {
        ...testDictionary,
        domain: 'financial',
        terms: testDictionary.terms.slice(0, 1)
      });
      
      const dictionaries = pluginManager.getLoadedDictionaries();
      
      expect(dictionaries).toHaveLength(2);
      expect(dictionaries.find(d => d.domain === 'ecommerce')).toBeDefined();
      expect(dictionaries.find(d => d.domain === 'financial')).toBeDefined();
    });
  });

  describe('パフォーマンス', () => {
    test('大きなファイルでの実行時間', async () => {
      const plugin = new DomainTermCoveragePlugin();
      pluginManager.registerDictionaryAwarePlugin(plugin);
      (pluginManager as any).loadedDictionaries.set('test', testDictionary);
      
      // 大きなテストファイルを生成
      const testFilePath = path.join(tempDir, 'large.test.ts');
      let largeContent = `
        import { PaymentService } from '../payment-service';
        import { UserService } from '../user-service';
        
        describe('Large Payment Tests', () => {
      `;
      
      // 100個のテストケースを生成
      for (let i = 0; i < 100; i++) {
        largeContent += `
          test('payment test ${i}', () => {
            const payment = new PaymentService();
            const user = createUser({ id: ${i} });
            const result = payment.processUserPayment(user, ${(i + 1) * 10});
            expect(result.payment.amount).toBe(${(i + 1) * 10});
          });
        `;
      }
      
      largeContent += '});';
      fs.writeFileSync(testFilePath, largeContent, 'utf-8');
      
      const startTime = Date.now();
      const result = await pluginManager.runDictionaryAwarePlugin(
        'domain-term-coverage',
        testFilePath,
        'test'
      );
      const executionTime = Date.now() - startTime;
      
      expect(result).not.toBeNull();
      expect(executionTime).toBeLessThan(5000); // 5秒以内
    });
  });
});