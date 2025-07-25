import { TermExtractor } from '../../../src/dictionary/extractors/termExtractor';
import { DomainTerm, CodeContext } from '../../../src/core/types';
import { errorHandler } from '../../../src/utils/errorHandler';

// モック設定
jest.mock('../../../src/utils/errorHandler');

const mockErrorHandler = errorHandler as jest.Mocked<typeof errorHandler>;

describe('TermExtractor', () => {
  let extractor: TermExtractor;

  beforeEach(() => {
    jest.clearAllMocks();
    extractor = new TermExtractor();
  });

  describe('extractFromCode', () => {
    test('TypeScriptコードから用語が抽出される', async () => {
      const code = `
        import { UserService } from './services/user-service';
        
        export class PaymentProcessor {
          private userService: UserService;
          private validationService: ValidationService;
          
          async processPayment(user: User, amount: number): Promise<PaymentResult> {
            const isValid = await this.validationService.validateUser(user);
            if (!isValid) {
              throw new PaymentError('Invalid user');
            }
            
            return await this.userService.processTransaction(amount);
          }
          
          calculateTax(amount: number): number {
            return amount * 0.1;
          }
        }
      `;

      const context: CodeContext = {
        filePath: '/test/PaymentProcessor.ts',
        language: 'typescript',
        functions: [],
        classes: [],
        imports: [],
        domainRelevance: 0,
        relatedTerms: []
      };

      const result = await extractor.extractFromCode(code, context);

      expect(result.extractedTerms.length).toBeGreaterThan(0);
      
      // 主要な用語が抽出されることを確認
      const termNames = result.extractedTerms.map(term => term.term);
      expect(termNames).toContain('UserService');
      expect(termNames).toContain('PaymentProcessor');
      expect(termNames).toContain('ValidationService');
      expect(termNames).toContain('User');
      expect(termNames).toContain('Payment');
    });

    test('JavaScriptコードから用語が抽出される', async () => {
      const code = `
        const express = require('express');
        const { createUser, validateEmail } = require('./user-utils');
        
        function setupUserRoutes(app) {
          app.post('/users', async (req, res) => {
            try {
              const email = req.body.email;
              if (!validateEmail(email)) {
                return res.status(400).json({ error: 'Invalid email' });
              }
              
              const user = await createUser(req.body);
              res.json(user);
            } catch (error) {
              res.status(500).json({ error: error.message });
            }
          });
          
          app.get('/users/:id', async (req, res) => {
            const userId = req.params.id;
            const user = await findUser(userId);
            
            if (!user) {
              return res.status(404).json({ error: 'User not found' });
            }
            
            res.json(user);
          });
        }
        
        module.exports = { setupUserRoutes };
      `;

      const context: CodeContext = {
        filePath: '/test/user-routes.js',
        language: 'javascript',
        functions: [],
        classes: [],
        imports: [],
        domainRelevance: 0,
        relatedTerms: []
      };

      const result = await extractor.extractFromCode(code, context);

      expect(result.extractedTerms.length).toBeGreaterThan(0);
      
      const termNames = result.extractedTerms.map(term => term.term);
      expect(termNames).toContain('User');
      expect(termNames).toContain('Email');
      expect(termNames.some(name => name.includes('Route'))).toBe(true);
    });

    test('関数名から用語が抽出される', async () => {
      const code = `
        function validateUserEmail(email) {
          return email.includes('@');
        }
        
        function processPaymentTransaction(amount, currency) {
          return paymentGateway.charge(amount, currency);
        }
        
        function generateReportSummary(data) {
          return createSummary(data);
        }
      `;

      const context: CodeContext = {
        filePath: '/test/functions.js',
        language: 'javascript',
        functions: [],
        classes: [],
        imports: [],
        domainRelevance: 0,
        relatedTerms: []
      };

      const result = await extractor.extractFromCode(code, context);

      const termNames = result.extractedTerms.map(term => term.term);
      expect(termNames).toContain('User');
      expect(termNames).toContain('Email');
      expect(termNames).toContain('Payment');
      expect(termNames).toContain('Transaction');
      expect(termNames).toContain('Report');
      expect(termNames).toContain('Summary');
    });

    test('変数名から用語が抽出される', async () => {
      const code = `
        const userAccount = new Account();
        const paymentGateway = new Gateway();
        let orderStatus = 'pending';
        var shippingAddress = getAddress();
        
        const userPreferences = {
          language: 'en',
          currency: 'USD',
          notifications: true
        };
      `;

      const context: CodeContext = {
        filePath: '/test/variables.js',
        language: 'javascript',
        functions: [],
        classes: [],
        imports: [],
        domainRelevance: 0,
        relatedTerms: []
      };

      const result = await extractor.extractFromCode(code, context);

      const termNames = result.extractedTerms.map(term => term.term);
      expect(termNames).toContain('User');
      expect(termNames).toContain('Account');
      expect(termNames).toContain('Payment');
      expect(termNames).toContain('Gateway');
      expect(termNames).toContain('Order');
      expect(termNames).toContain('Status');
      expect(termNames).toContain('Shipping');
      expect(termNames).toContain('Address');
      expect(termNames).toContain('Preferences');
    });

    test('コメントから用語が抽出される', async () => {
      const code = `
        /**
         * User authentication service
         * Handles login, logout, and password reset
         */
        class AuthenticationService {
          // Payment processing integration
          async processSubscription(user) {
            // Validate credit card information
            return true;
          }
          
          /* 
           * Email notification service
           * Sends welcome emails to new users
           */
          async sendWelcomeEmail(email) {
            return emailService.send(email);
          }
        }
      `;

      const context: CodeContext = {
        filePath: '/test/comments.js',
        language: 'javascript',
        functions: [],
        classes: [],
        imports: [],
        domainRelevance: 0,
        relatedTerms: []
      };

      const result = await extractor.extractFromCode(code, context);

      const termNames = result.extractedTerms.map(term => term.term);
      expect(termNames).toContain('User');
      expect(termNames).toContain('Authentication');
      expect(termNames).toContain('Login');
      expect(termNames).toContain('Password');
      expect(termNames).toContain('Payment');
      expect(termNames).toContain('Subscription');
      expect(termNames).toContain('Credit');
      expect(termNames).toContain('Card');
      expect(termNames).toContain('Email');
      expect(termNames).toContain('Notification');
    });

    test('型注釈から用語が抽出される（TypeScript）', async () => {
      const code = `
        interface UserProfile {
          id: string;
          email: string;
          preferences: UserPreferences;
        }
        
        type PaymentMethod = 'credit_card' | 'paypal' | 'bank_transfer';
        
        class OrderService {
          async createOrder(
            user: UserProfile,
            items: OrderItem[],
            payment: PaymentMethod
          ): Promise<OrderResult> {
            return new Order(user, items, payment);
          }
        }
      `;

      const context: CodeContext = {
        filePath: '/test/types.ts',
        language: 'typescript',
        functions: [],
        classes: [],
        imports: [],
        domainRelevance: 0,
        relatedTerms: []
      };

      const result = await extractor.extractFromCode(code, context);

      const termNames = result.extractedTerms.map(term => term.term);
      expect(termNames).toContain('User');
      expect(termNames).toContain('Profile');
      expect(termNames).toContain('Preferences');
      expect(termNames).toContain('Payment');
      expect(termNames).toContain('Method');
      expect(termNames).toContain('Order');
      expect(termNames).toContain('Item');
      expect(termNames).toContain('Result');
      expect(termNames).toContain('Service');
    });
  });

  describe('categorizeTerms', () => {
    test('用語が適切にカテゴリ分類される', () => {
      const terms: DomainTerm[] = [
        {
          id: 'user',
          term: 'User',
          definition: 'System user',
          category: 'business',
          importance: 'high',
          aliases: [],
          examples: [],
          relatedPatterns: [],
          testRequirements: []
        },
        {
          id: 'service',
          term: 'Service',
          definition: 'Application service',
          category: 'technical',
          importance: 'medium',
          aliases: [],
          examples: [],
          relatedPatterns: [],
          testRequirements: []
        },
        {
          id: 'payment',
          term: 'Payment',
          definition: 'Payment processing',
          category: 'financial',
          importance: 'critical',
          aliases: [],
          examples: [],
          relatedPatterns: [],
          testRequirements: []
        }
      ];

      const categorized = extractor.categorizeTerms(terms);

      expect(categorized.business).toHaveLength(1);
      expect(categorized.technical).toHaveLength(1);
      expect(categorized.financial).toHaveLength(1);
      expect(categorized.business[0].term).toBe('User');
      expect(categorized.technical[0].term).toBe('Service');
      expect(categorized.financial[0].term).toBe('Payment');
    });

    test('空の配列で空のカテゴリを返す', () => {
      const categorized = extractor.categorizeTerms([]);

      expect(Object.keys(categorized)).toHaveLength(0);
    });

    test('同じカテゴリの複数用語が正しく分類される', () => {
      const terms: DomainTerm[] = [
        {
          id: 'user',
          term: 'User',
          definition: 'System user',
          category: 'business',
          importance: 'high',
          aliases: [],
          examples: [],
          relatedPatterns: [],
          testRequirements: []
        },
        {
          id: 'customer',
          term: 'Customer',
          definition: 'Business customer',
          category: 'business',
          importance: 'high',
          aliases: [],
          examples: [],
          relatedPatterns: [],
          testRequirements: []
        }
      ];

      const categorized = extractor.categorizeTerms(terms);

      expect(categorized.business).toHaveLength(2);
      expect(categorized.business.map(t => t.term)).toContain('User');
      expect(categorized.business.map(t => t.term)).toContain('Customer');
    });
  });

  describe('generateRelatedPatterns', () => {
    test('用語から関連パターンが生成される', () => {
      const term = 'UserService';

      const patterns = extractor.generateRelatedPatterns(term);

      expect(patterns.length).toBeGreaterThan(0);
      expect(patterns).toContain('UserService');
      expect(patterns).toContain('userService');
      expect(patterns).toContain('user_service');
      expect(patterns.some(p => p.includes('User.*Service'))).toBe(true);
      expect(patterns.some(p => p.includes('user.*service'))).toBe(true);
    });

    test('複合語から複数のパターンが生成される', () => {
      const term = 'PaymentGatewayService';

      const patterns = extractor.generateRelatedPatterns(term);

      expect(patterns.some(p => p.includes('Payment'))).toBe(true);
      expect(patterns.some(p => p.includes('Gateway'))).toBe(true);
      expect(patterns.some(p => p.includes('Service'))).toBe(true);
      expect(patterns.some(p => p.includes('payment.*gateway.*service'))).toBe(true);
    });

    test('単語が短い場合、基本パターンのみ生成される', () => {
      const term = 'API';

      const patterns = extractor.generateRelatedPatterns(term);

      expect(patterns).toContain('API');
      expect(patterns).toContain('api');
      expect(patterns.some(p => p.includes('API'))).toBe(true);
    });
  });

  describe('inferImportance', () => {
    test('コンテキストに基づいて重要度が推論される', () => {
      const term = 'PaymentService';
      const context: CodeContext = {
        filePath: '/src/core/payment/PaymentService.ts',
        language: 'typescript',
        functions: [
          { name: 'processPayment', complexity: 8, returnType: 'Promise<PaymentResult>' },
          { name: 'validatePayment', complexity: 5, returnType: 'boolean' }
        ],
        classes: ['PaymentService'],
        imports: [
          { module: 'Database', path: './database' },
          { module: 'Logger', path: './logger' }
        ],
        domainRelevance: 0.9,
        relatedTerms: []
      };

      const importance = extractor.inferImportance(term, context);

      expect(importance).toBe('critical'); // コア機能で複雑度が高い
    });

    test('テストファイルでは重要度が低く推論される', () => {
      const term = 'UserService';
      const context: CodeContext = {
        filePath: '/test/user-service.test.ts',
        language: 'typescript',
        functions: [
          { name: 'testCreateUser', complexity: 2, returnType: 'void' }
        ],
        classes: [],
        imports: [],
        domainRelevance: 0.3,
        relatedTerms: []
      };

      const importance = extractor.inferImportance(term, context);

      expect(importance).toBe('low');
    });

    test('ユーティリティファイルでは中程度の重要度', () => {
      const term = 'Validator';
      const context: CodeContext = {
        filePath: '/src/utils/validator.ts',
        language: 'typescript',
        functions: [
          { name: 'validateEmail', complexity: 3, returnType: 'boolean' }
        ],
        classes: [],
        imports: [],
        domainRelevance: 0.5,
        relatedTerms: []
      };

      const importance = extractor.inferImportance(term, context);

      expect(importance).toBe('medium');
    });
  });

  describe('extractExamples', () => {
    test('コードから使用例が抽出される', () => {
      const term = 'UserService';
      const code = `
        const userService = new UserService();
        const user = await userService.createUser(userData);
        userService.validateUser(user);
        
        class UserController {
          constructor(private userService: UserService) {}
          
          async getUser(id: string) {
            return this.userService.findById(id);
          }
        }
      `;

      const examples = extractor.extractExamples(term, code);

      expect(examples.length).toBeGreaterThan(0);
      expect(examples.some(ex => ex.code.includes('new UserService()'))).toBe(true);
      expect(examples.some(ex => ex.code.includes('createUser'))).toBe(true);
      expect(examples.some(ex => ex.code.includes('findById'))).toBe(true);
    });

    test('関数呼び出しの例が抽出される', () => {
      const term = 'Payment';
      const code = `
        function processPayment(amount, currency) {
          const payment = new Payment(amount, currency);
          return payment.process();
        }
        
        const result = processPayment(100, 'USD');
        validatePayment(result);
      `;

      const examples = extractor.extractExamples(term, code);

      expect(examples.some(ex => ex.code.includes('new Payment'))).toBe(true);
      expect(examples.some(ex => ex.code.includes('processPayment'))).toBe(true);
      expect(examples.some(ex => ex.code.includes('validatePayment'))).toBe(true);
    });

    test('無関係なコードからは例が抽出されない', () => {
      const term = 'DatabaseConnection';
      const code = `
        function add(a, b) {
          return a + b;
        }
        
        const result = Math.sqrt(16);
      `;

      const examples = extractor.extractExamples(term, code);

      expect(examples).toHaveLength(0);
    });
  });

  describe('estimateCategory', () => {
    test('技術的な用語が適切に分類される', () => {
      const techTerms = ['Service', 'Repository', 'Controller', 'Middleware', 'Database', 'API'];
      
      techTerms.forEach(term => {
        const category = extractor.estimateCategory(term);
        expect(category).toBe('technical');
      });
    });

    test('ビジネス用語が適切に分類される', () => {
      const businessTerms = ['User', 'Customer', 'Order', 'Product', 'Account', 'Profile'];
      
      businessTerms.forEach(term => {
        const category = extractor.estimateCategory(term);
        expect(category).toBe('business');
      });
    });

    test('金融用語が適切に分類される', () => {
      const financialTerms = ['Payment', 'Transaction', 'Invoice', 'Billing', 'Credit', 'Debit'];
      
      financialTerms.forEach(term => {
        const category = extractor.estimateCategory(term);
        expect(category).toBe('financial');
      });
    });

    test('セキュリティ用語が適切に分類される', () => {
      const securityTerms = ['Authentication', 'Authorization', 'Token', 'Encryption', 'Security'];
      
      securityTerms.forEach(term => {
        const category = extractor.estimateCategory(term);
        expect(category).toBe('security');
      });
    });

    test('不明な用語はotherに分類される', () => {
      const unknownTerms = ['Foo', 'Bar', 'Baz', 'RandomTerm'];
      
      unknownTerms.forEach(term => {
        const category = extractor.estimateCategory(term);
        expect(category).toBe('other');
      });
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

      const result = await extractor.extractFromCode(invalidCode, context);

      expect(result.extractedTerms).toBeDefined();
      expect(Array.isArray(result.extractedTerms)).toBe(true);
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

      const result = await extractor.extractFromCode(emptyCode, context);

      expect(result.extractedTerms).toHaveLength(0);
      expect(result.confidence).toBe(0);
    });

    test('nullやundefinedの入力でエラーが処理される', async () => {
      const context: CodeContext = {
        filePath: '/test/null.js',
        language: 'javascript',
        functions: [],
        classes: [],
        imports: [],
        domainRelevance: 0,
        relatedTerms: []
      };

      await expect(extractor.extractFromCode(null as any, context)).resolves.toBeDefined();
      await expect(extractor.extractFromCode(undefined as any, context)).resolves.toBeDefined();
    });

    test('不正な関数への入力でエラーが処理される', () => {
      expect(() => extractor.generateRelatedPatterns('')).not.toThrow();
      expect(() => extractor.estimateCategory('')).not.toThrow();
      expect(() => extractor.extractExamples('', null as any)).not.toThrow();
    });
  });

  describe('パフォーマンス', () => {
    test('大きなコードファイルも適切な時間で処理される', async () => {
      // 大きなコードファイルを生成
      let largeCode = '';
      for (let i = 0; i < 1000; i++) {
        largeCode += `
          class Service${i} {
            process${i}() {
              return this.handler${i}.execute();
            }
          }
          
          function process${i}Data(data${i}) {
            return validate${i}(data${i});
          }
        `;
      }

      const context: CodeContext = {
        filePath: '/test/large.js',
        language: 'javascript',
        functions: [],
        classes: [],
        imports: [],
        domainRelevance: 0,
        relatedTerms: []
      };

      const startTime = Date.now();
      const result = await extractor.extractFromCode(largeCode, context);
      const endTime = Date.now();

      expect(result.extractedTerms.length).toBeGreaterThan(0);
      expect(endTime - startTime).toBeLessThan(10000); // 10秒以内
    });

    test('重複用語が適切に除去される', async () => {
      const codeWithDuplicates = `
        const userService = new UserService();
        const userService2 = new UserService();
        const userController = new UserController();
        const userController2 = new UserController();
      `;

      const context: CodeContext = {
        filePath: '/test/duplicates.js',
        language: 'javascript',
        functions: [],
        classes: [],
        imports: [],
        domainRelevance: 0,
        relatedTerms: []
      };

      const result = await extractor.extractFromCode(codeWithDuplicates, context);

      const termNames = result.extractedTerms.map(term => term.term);
      const uniqueTermNames = [...new Set(termNames)];
      
      expect(termNames.length).toBe(uniqueTermNames.length);
    });
  });
});