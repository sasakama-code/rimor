import { KnowledgeExtractor } from '../../../src/dictionary/extractors/knowledgeExtractor';
import { DomainDictionary, BusinessRule, QualityStandard, CodeContext } from '../../../src/core/types';
import { errorHandler } from '../../../src/utils/errorHandler';

// モック設定
jest.mock('../../../src/utils/errorHandler');

const mockErrorHandler = errorHandler as jest.Mocked<typeof errorHandler>;

describe('KnowledgeExtractor', () => {
  let extractor: KnowledgeExtractor;

  beforeEach(() => {
    jest.clearAllMocks();
    extractor = new KnowledgeExtractor();
  });

  describe('extractBusinessRules', () => {
    test('コードからビジネスルールが抽出される', async () => {
      const code = `
        /**
         * Payment amount must be greater than 0
         * @rule Payment validation
         * @priority high
         */
        function validatePaymentAmount(amount) {
          if (amount <= 0) {
            throw new Error('Payment amount must be positive');
          }
          return true;
        }
        
        /**
         * User email must be valid format
         * @rule Email validation
         * @priority medium
         */
        function validateEmail(email) {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(email)) {
            throw new Error('Invalid email format');
          }
          return true;
        }
        
        // User age must be 18 or older for account creation
        function validateUserAge(age) {
          const MIN_AGE = 18;
          return age >= MIN_AGE;
        }
      `;

      const context: CodeContext = {
        filePath: '/test/validation.js',
        language: 'javascript',
        functions: [],
        classes: [],
        imports: [],
        domainRelevance: 0.8,
        relatedTerms: []
      };

      const result = await extractor.extractBusinessRules(code, context);

      expect(result.extractedRules.length).toBeGreaterThan(0);
      
      // アノテーション付きルールが抽出される
      const paymentRule = result.extractedRules.find(rule => 
        rule.name.includes('Payment validation')
      );
      expect(paymentRule).toBeDefined();
      expect(paymentRule?.priority).toBeLessThan(50); // high priority
      
      const emailRule = result.extractedRules.find(rule => 
        rule.name.includes('Email validation')
      );
      expect(emailRule).toBeDefined();
      expect(emailRule?.priority).toBeGreaterThan(50); // medium priority
      
      // コメントからのルール抽出
      const ageRule = result.extractedRules.find(rule => 
        rule.description.includes('18 or older')
      );
      expect(ageRule).toBeDefined();
    });

    test('条件文からビジネスルールが推論される', async () => {
      const code = `
        function processOrder(order) {
          // Business rules inferred from conditions
          if (order.total < 0) {
            throw new Error('Order total cannot be negative');
          }
          
          if (order.items.length === 0) {
            throw new Error('Order must contain at least one item');
          }
          
          if (order.customerAge < 18 && order.requiresAgeVerification) {
            throw new Error('Customer must be 18+ for age-restricted items');
          }
          
          if (!order.shippingAddress) {
            throw new Error('Shipping address is required');
          }
          
          return processOrderInternal(order);
        }
        
        function validateCreditCard(cardNumber) {
          if (cardNumber.length < 13 || cardNumber.length > 19) {
            return false;
          }
          
          // Luhn algorithm check
          return isValidLuhn(cardNumber);
        }
      `;

      const context: CodeContext = {
        filePath: '/test/order-processing.js',
        language: 'javascript',
        functions: [],
        classes: [],
        imports: [],
        domainRelevance: 0.9,
        relatedTerms: []
      };

      const result = await extractor.extractBusinessRules(code, context);

      expect(result.extractedRules.length).toBeGreaterThan(3);
      
      // 注文金額のルール
      const totalRule = result.extractedRules.find(rule => 
        rule.description.includes('total') && rule.description.includes('negative')
      );
      expect(totalRule).toBeDefined();
      
      // 商品数のルール
      const itemsRule = result.extractedRules.find(rule => 
        rule.description.includes('at least one item')
      );
      expect(itemsRule).toBeDefined();
      
      // 年齢制限のルール
      const ageRule = result.extractedRules.find(rule => 
        rule.description.includes('18+')
      );
      expect(ageRule).toBeDefined();
      
      // クレジットカードのルール
      const cardRule = result.extractedRules.find(rule => 
        rule.description.includes('credit card') || rule.description.includes('card')
      );
      expect(cardRule).toBeDefined();
    });

    test('設定定数からビジネスルールが抽出される', async () => {
      const code = `
        const BUSINESS_RULES = {
          MAX_LOGIN_ATTEMPTS: 3,
          SESSION_TIMEOUT_MINUTES: 30,
          MIN_PASSWORD_LENGTH: 8,
          MAX_FILE_SIZE_MB: 10,
          SUPPORTED_CURRENCIES: ['USD', 'EUR', 'JPY']
        };
        
        const VALIDATION_RULES = {
          EMAIL_REQUIRED: true,
          PHONE_REQUIRED: false,
          ADDRESS_REQUIRED: true
        };
        
        // Business configuration
        const CONFIG = {
          maxOrderValue: 10000,
          minOrderValue: 1,
          shippingFreeThreshold: 50
        };
      `;

      const context: CodeContext = {
        filePath: '/test/config.js',
        language: 'javascript',
        functions: [],
        classes: [],
        imports: [],
        domainRelevance: 0.7,
        relatedTerms: []
      };

      const result = await extractor.extractBusinessRules(code, context);

      expect(result.extractedRules.length).toBeGreaterThan(5);
      
      // ログイン試行回数のルール
      const loginRule = result.extractedRules.find(rule => 
        rule.description.includes('login attempts')
      );
      expect(loginRule).toBeDefined();
      
      // パスワード長のルール
      const passwordRule = result.extractedRules.find(rule => 
        rule.description.includes('password length')
      );
      expect(passwordRule).toBeDefined();
      
      // 注文金額のルール
      const orderRule = result.extractedRules.find(rule => 
        rule.description.includes('order value')
      );
      expect(orderRule).toBeDefined();
    });
  });

  describe('extractQualityStandards', () => {
    test('コメントから品質基準が抽出される', async () => {
      const code = `
        /**
         * @quality All payment functions must have unit tests
         * @coverage 100%
         * @performance Response time < 100ms
         */
        class PaymentService {
          processPayment(amount) {
            // @quality Input validation required
            return this.gateway.charge(amount);
          }
        }
        
        /**
         * @quality Security: All user data must be encrypted
         * @compliance PCI-DSS
         */
        function storeUserPaymentInfo(data) {
          return encrypt(data);
        }
        
        // @quality: Error handling must include logging
        function handlePaymentError(error) {
          logger.error('Payment failed', error);
          throw error;
        }
      `;

      const context: CodeContext = {
        filePath: '/test/payment-service.js',
        language: 'javascript',
        functions: [],
        classes: [],
        imports: [],
        domainRelevance: 0.9,
        relatedTerms: []
      };

      const result = await extractor.extractQualityStandards(code, context);

      expect(result.extractedStandards.length).toBeGreaterThan(2);
      
      // テストカバレッジ基準
      const testStandard = result.extractedStandards.find(std => 
        std.description.includes('unit tests')
      );
      expect(testStandard).toBeDefined();
      expect(testStandard?.metrics.coverage).toBe(100);
      
      // パフォーマンス基準
      const perfStandard = result.extractedStandards.find(std => 
        std.description.includes('Response time')
      );
      expect(perfStandard).toBeDefined();
      expect(perfStandard?.metrics.performance).toBeLessThan(100);
      
      // セキュリティ基準
      const securityStandard = result.extractedStandards.find(std => 
        std.description.includes('encrypted')
      );
      expect(securityStandard).toBeDefined();
      expect(securityStandard?.category).toBe('security');
    });

    test('テストファイルから品質基準が推論される', async () => {
      const code = `
        describe('PaymentService', () => {
          it('should validate payment amount', () => {
            expect(() => paymentService.process(-100)).toThrow();
          });
          
          it('should process valid payments within 50ms', async () => {
            const start = Date.now();
            await paymentService.process(100);
            const duration = Date.now() - start;
            expect(duration).toBeLessThan(50);
          });
          
          it('should handle payment errors gracefully', () => {
            // Error handling test
            expect(paymentService.processInvalidPayment).not.toThrow();
          });
          
          it('should encrypt sensitive data', () => {
            const result = paymentService.storeCardInfo(cardData);
            expect(result.encrypted).toBe(true);
          });
        });
      `;

      const context: CodeContext = {
        filePath: '/test/payment-service.test.js',
        language: 'javascript',
        functions: [],
        classes: [],
        imports: [],
        domainRelevance: 0.8,
        relatedTerms: []
      };

      const result = await extractor.extractQualityStandards(code, context);

      expect(result.extractedStandards.length).toBeGreaterThan(2);
      
      // パフォーマンス基準
      const perfStandard = result.extractedStandards.find(std => 
        std.metrics.performance && std.metrics.performance <= 50
      );
      expect(perfStandard).toBeDefined();
      
      // エラーハンドリング基準
      const errorStandard = result.extractedStandards.find(std => 
        std.description.includes('error') && std.description.includes('gracefully')
      );
      expect(errorStandard).toBeDefined();
      
      // セキュリティ基準
      const securityStandard = result.extractedStandards.find(std => 
        std.description.includes('encrypt')
      );
      expect(securityStandard).toBeDefined();
    });

    test('eslintやlinterの設定から品質基準が抽出される', async () => {
      const code = `
        module.exports = {
          rules: {
            'max-complexity': ['error', 10],
            'max-lines-per-function': ['error', 50],
            'no-console': 'error',
            'prefer-const': 'error',
            'no-var': 'error'
          },
          
          // Custom quality rules
          'custom-rules': {
            'require-tests': true,
            'max-dependencies': 5,
            'require-documentation': true
          }
        };
      `;

      const context: CodeContext = {
        filePath: '/test/.eslintrc.js',
        language: 'javascript',
        functions: [],
        classes: [],
        imports: [],
        domainRelevance: 0.6,
        relatedTerms: []
      };

      const result = await extractor.extractQualityStandards(code, context);

      expect(result.extractedStandards.length).toBeGreaterThan(3);
      
      // 複雑度基準
      const complexityStandard = result.extractedStandards.find(std => 
        std.description.includes('complexity') && std.metrics.complexity === 10
      );
      expect(complexityStandard).toBeDefined();
      
      // 関数長基準
      const linesStandard = result.extractedStandards.find(std => 
        std.description.includes('lines per function')
      );
      expect(linesStandard).toBeDefined();
      
      // ドキュメント基準
      const docStandard = result.extractedStandards.find(std => 
        std.description.includes('documentation')
      );
      expect(docStandard).toBeDefined();
    });
  });

  describe('extractKnowledgePatterns', () => {
    test('設計パターンが識別される', async () => {
      const code = `
        // Singleton pattern
        class DatabaseConnection {
          constructor() {
            if (DatabaseConnection.instance) {
              return DatabaseConnection.instance;
            }
            DatabaseConnection.instance = this;
          }
          
          static getInstance() {
            return new DatabaseConnection();
          }
        }
        
        // Factory pattern
        class PaymentFactory {
          createPayment(type) {
            switch (type) {
              case 'credit':
                return new CreditCardPayment();
              case 'paypal':
                return new PayPalPayment();
              default:
                throw new Error('Unknown payment type');
            }
          }
        }
        
        // Observer pattern
        class EventEmitter {
          constructor() {
            this.listeners = {};
          }
          
          on(event, callback) {
            if (!this.listeners[event]) {
              this.listeners[event] = [];
            }
            this.listeners[event].push(callback);
          }
          
          emit(event, data) {
            if (this.listeners[event]) {
              this.listeners[event].forEach(callback => callback(data));
            }
          }
        }
      `;

      const context: CodeContext = {
        filePath: '/test/patterns.js',
        language: 'javascript',
        functions: [],
        classes: [],
        imports: [],
        domainRelevance: 0.7,
        relatedTerms: []
      };

      const result = await extractor.extractKnowledgePatterns(code, context);

      expect(result.patterns.length).toBeGreaterThan(2);
      
      // シングルトンパターン
      const singletonPattern = result.patterns.find(pattern => 
        pattern.name.includes('Singleton')
      );
      expect(singletonPattern).toBeDefined();
      expect(singletonPattern?.confidence).toBeGreaterThan(0.7);
      
      // ファクトリーパターン
      const factoryPattern = result.patterns.find(pattern => 
        pattern.name.includes('Factory')
      );
      expect(factoryPattern).toBeDefined();
      
      // オブザーバーパターン
      const observerPattern = result.patterns.find(pattern => 
        pattern.name.includes('Observer')
      );
      expect(observerPattern).toBeDefined();
    });

    test('アーキテクチャパターンが識別される', async () => {
      const code = `
        // MVC pattern
        class UserController {
          constructor(userModel, userView) {
            this.model = userModel;
            this.view = userView;
          }
          
          async getUser(id) {
            const user = await this.model.findById(id);
            return this.view.render(user);
          }
        }
        
        class UserModel {
          async findById(id) {
            return await database.query('SELECT * FROM users WHERE id = ?', [id]);
          }
        }
        
        class UserView {
          render(user) {
            return `<div>User: ${user.name}</div>`;
          }
        }
        
        // Repository pattern
        class UserRepository {
          constructor(database) {
            this.db = database;
          }
          
          async findById(id) {
            return await this.db.findOne('users', { id });
          }
          
          async save(user) {
            return await this.db.save('users', user);
          }
        }
        
        // Service layer pattern
        class UserService {
          constructor(userRepository) {
            this.repository = userRepository;
          }
          
          async createUser(userData) {
            const user = new User(userData);
            return await this.repository.save(user);
          }
        }
      `;

      const context: CodeContext = {
        filePath: '/test/architecture.js',
        language: 'javascript',
        functions: [],
        classes: [],
        imports: [],
        domainRelevance: 0.8,
        relatedTerms: []
      };

      const result = await extractor.extractKnowledgePatterns(code, context);

      expect(result.patterns.length).toBeGreaterThan(2);
      
      // MVCパターン
      const mvcPattern = result.patterns.find(pattern => 
        pattern.name.includes('MVC') || pattern.name.includes('Model-View-Controller')
      );
      expect(mvcPattern).toBeDefined();
      
      // リポジトリパターン
      const repoPattern = result.patterns.find(pattern => 
        pattern.name.includes('Repository')
      );
      expect(repoPattern).toBeDefined();
      
      // サービス層パターン
      const servicePattern = result.patterns.find(pattern => 
        pattern.name.includes('Service')
      );
      expect(servicePattern).toBeDefined();
    });
  });

  describe('analyzeCodeComplexity', () => {
    test('循環的複雑度が計算される', () => {
      const complexCode = `
        function complexFunction(data) {
          if (data.type === 'A') {           // +1
            if (data.value > 100) {          // +1
              for (let i = 0; i < 10; i++) { // +1
                if (data.items[i]) {         // +1
                  try {
                    processItem(data.items[i]);
                  } catch (error) {          // +1
                    handleError(error);
                  }
                }
              }
            } else {
              return defaultValue();
            }
          } else if (data.type === 'B') {    // +1
            while (data.processing) {        // +1
              data = processNext(data);
            }
          } else {
            switch (data.subtype) {         // +1
              case 'X':                     // +1
                return processX(data);
              case 'Y':                     // +1
                return processY(data);
              default:
                return processDefault(data);
            }
          }
        }
      `;

      const result = extractor.analyzeCodeComplexity(complexCode);

      expect(result.cyclomaticComplexity).toBeGreaterThan(8);
      expect(result.cognitiveComplexity).toBeGreaterThan(10);
      expect(result.nestingDepth).toBeGreaterThan(3);
      expect(result.complexityScore).toBeGreaterThan(7);
    });

    test('シンプルなコードでは低い複雑度', () => {
      const simpleCode = `
        function simpleFunction(a, b) {
          return a + b;
        }
        
        function anotherSimple(x) {
          if (x > 0) {
            return x * 2;
          }
          return 0;
        }
      `;

      const result = extractor.analyzeCodeComplexity(simpleCode);

      expect(result.cyclomaticComplexity).toBeLessThan(4);
      expect(result.cognitiveComplexity).toBeLessThan(5);
      expect(result.nestingDepth).toBeLessThan(3);
      expect(result.complexityScore).toBeLessThan(4);
    });
  });

  describe('inferTestRequirements', () => {
    test('抽出されたルールからテスト要件が推論される', () => {
      const businessRules: BusinessRule[] = [
        {
          id: 'payment-validation',
          name: 'Payment Validation Rule',
          description: 'Payment amount must be positive',
          domain: 'financial',
          condition: {
            type: 'function-name',
            pattern: '.*payment.*',
            scope: 'function'
          },
          requirements: [],
          priority: 10
        },
        {
          id: 'user-age-rule',
          name: 'User Age Validation',
          description: 'User must be 18 or older',
          domain: 'business',
          condition: {
            type: 'function-name',
            pattern: '.*age.*',
            scope: 'function'
          },
          requirements: [],
          priority: 50
        }
      ];

      const qualityStandards: QualityStandard[] = [
        {
          id: 'coverage-standard',
          name: 'Test Coverage Standard',
          description: 'All functions must have 90% test coverage',
          category: 'testing',
          metrics: {
            coverage: 90
          },
          applicableScopes: ['function']
        }
      ];

      const requirements = extractor.inferTestRequirements(
        businessRules,
        qualityStandards
      );

      expect(requirements.length).toBeGreaterThan(3);
      
      // ビジネスルールからの要件
      const paymentTest = requirements.find(req => 
        req.description.includes('payment') && req.description.includes('positive')
      );
      expect(paymentTest).toBeDefined();
      expect(paymentTest?.type).toBe('must-have'); // 高優先度
      
      const ageTest = requirements.find(req => 
        req.description.includes('age') && req.description.includes('18')
      );
      expect(ageTest).toBeDefined();
      expect(ageTest?.type).toBe('should-have'); // 中優先度
      
      // 品質基準からの要件
      const coverageTest = requirements.find(req => 
        req.description.includes('coverage')
      );
      expect(coverageTest).toBeDefined();
    });
  });

  describe('エラーハンドリング', () => {
    test('不正なコードでエラーが適切に処理される', async () => {
      const invalidCode = 'function unclosed() { if (true) {';
      const context: CodeContext = {
        filePath: '/test/invalid.js',
        language: 'javascript',
        functions: [],
        classes: [],
        imports: [],
        domainRelevance: 0,
        relatedTerms: []
      };

      const rulesResult = await extractor.extractBusinessRules(invalidCode, context);
      const standardsResult = await extractor.extractQualityStandards(invalidCode, context);
      const patternsResult = await extractor.extractKnowledgePatterns(invalidCode, context);

      expect(rulesResult.extractedRules).toBeDefined();
      expect(standardsResult.extractedStandards).toBeDefined();
      expect(patternsResult.patterns).toBeDefined();
      expect(mockErrorHandler.handleError).toHaveBeenCalled();
    });

    test('空のコードでも適切に処理される', async () => {
      const emptyCode = '';
      const context: CodeContext = {
        filePath: '/test/empty.js',
        language: 'javascript',
        functions: [],
        classes: [],
        imports: [],
        domainRelevance: 0,
        relatedTerms: []
      };

      const rulesResult = await extractor.extractBusinessRules(emptyCode, context);
      const standardsResult = await extractor.extractQualityStandards(emptyCode, context);
      const patternsResult = await extractor.extractKnowledgePatterns(emptyCode, context);

      expect(rulesResult.extractedRules).toHaveLength(0);
      expect(standardsResult.extractedStandards).toHaveLength(0);
      expect(patternsResult.patterns).toHaveLength(0);
    });

    test('複雑度分析でエラーが処理される', () => {
      const result = extractor.analyzeCodeComplexity(null as any);

      expect(result.cyclomaticComplexity).toBe(0);
      expect(result.cognitiveComplexity).toBe(0);
      expect(result.nestingDepth).toBe(0);
      expect(result.complexityScore).toBe(0);
    });
  });

  describe('パフォーマンス', () => {
    test('大きなコードファイルも適切な時間で処理される', async () => {
      // 大きなコードファイルを生成
      let largeCode = '';
      for (let i = 0; i < 500; i++) {
        largeCode += `
          // @rule Rule ${i}: Business logic ${i}
          function processRule${i}(data) {
            if (data.type === 'type${i}') {
              if (data.value > ${i}) {
                for (let j = 0; j < ${i % 10}; j++) {
                  if (data.items[j]) {
                    processItem${i}(data.items[j]);
                  }
                }
              }
            }
            return data;
          }
        `;
      }

      const context: CodeContext = {
        filePath: '/test/large.js',
        language: 'javascript',
        functions: [],
        classes: [],
        imports: [],
        domainRelevance: 0.8,
        relatedTerms: []
      };

      const startTime = Date.now();
      const rulesResult = await extractor.extractBusinessRules(largeCode, context);
      const standardsResult = await extractor.extractQualityStandards(largeCode, context);
      const patternsResult = await extractor.extractKnowledgePatterns(largeCode, context);
      const endTime = Date.now();

      expect(rulesResult.extractedRules.length).toBeGreaterThan(0);
      expect(endTime - startTime).toBeLessThan(15000); // 15秒以内
    });
  });
});