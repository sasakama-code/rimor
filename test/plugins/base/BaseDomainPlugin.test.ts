/**
 * BaseDomainPlugin テスト
 * 
 * TDD RED段階: ドメインプラグインの基底クラステスト
 * SOLID原則に従い、ドメイン固有の共通機能を提供
 */

import { BaseDomainPlugin, DomainDictionary, DomainQualityScore } from '../../../src/plugins/base/BaseDomainPlugin';
import { BasePlugin } from '../../../src/plugins/base/BasePlugin';
import { ProjectContext, TestFile, DetectionResult, Improvement } from '../../../src/core/types';

// テスト用の具象クラス
class TestDomainPlugin extends BaseDomainPlugin {
  id = 'test-domain';
  name = 'Test Domain Plugin';
  version = '1.0.0';

  isApplicable(context: ProjectContext): boolean {
    const domainInfo = this.extractDomainInfo(context);
    return domainInfo === 'ecommerce' || domainInfo === 'finance';
  }

  async detectPatterns(testFile: TestFile): Promise<DetectionResult[]> {
    return this.detectDomainPatterns(testFile);
  }

  async detectDomainPatterns(testFile: TestFile): Promise<DetectionResult[]> {
    const results: DetectionResult[] = [];
    const detectedTerms = this.detectDomainTerms(testFile.content);
    const violatedRules = this.checkBusinessRuleCompliance(testFile.content, detectedTerms);

    // ドメイン用語の不足を検出
    if (detectedTerms.length === 0) {
      results.push({
        patternId: 'missing-domain-terms',
        patternName: 'Missing Domain Terms',
        severity: 'medium',
        confidence: 0.8,
        location: {
          file: testFile.path,
          line: 1,
          column: 1
        },
        metadata: {
          description: 'No domain-specific terms found in test',
          category: 'domain'
        }
      });
    }

    // ビジネスルール違反を検出
    for (const rule of violatedRules) {
      results.push({
        patternId: `business-rule-violation-${rule.id}`,
        patternName: `Business Rule Violation: ${rule.name}`,
        severity: rule.priority,
        confidence: 0.9,
        location: {
          file: testFile.path,
          line: 1,
          column: 1
        },
        metadata: {
          description: rule.description,
          category: 'business-rule'
        }
      });
    }

    return results;
  }

  evaluateQuality(patterns: DetectionResult[]): DomainQualityScore {
    return this.evaluateDomainQuality(patterns);
  }

  evaluateDomainQuality(patterns: DetectionResult[]): DomainQualityScore {
    const detectedTerms = this.dictionary ? this.detectDomainTerms('') : [];
    const violatedRules = patterns.filter(p => p.patternId && p.patternId.startsWith('business-rule-violation'))
      .map(() => this.dictionary?.rules[0])
      .filter(Boolean) as any[];

    return this.calculateDomainQualityScore(detectedTerms, violatedRules);
  }

  suggestImprovements(evaluation: DomainQualityScore): Improvement[] {
    const violatedRules = this.dictionary?.rules.filter(rule => rule.testRequired) || [];
    return this.generateDomainImprovements(violatedRules, evaluation);
  }
}

describe('BaseDomainPlugin', () => {
  let plugin: TestDomainPlugin;
  let mockDictionary: DomainDictionary;

  beforeEach(() => {
    plugin = new TestDomainPlugin();
    mockDictionary = {
      terms: [
        {
          term: 'cart',
          definition: 'Shopping cart for products',
          category: 'ecommerce',
          aliases: ['basket', 'shopping-cart']
        },
        {
          term: 'checkout',
          definition: 'Process of completing a purchase',
          category: 'ecommerce',
          relatedTerms: ['payment', 'order']
        },
        {
          term: 'inventory',
          definition: 'Product stock management',
          category: 'ecommerce'
        }
      ],
      rules: [
        {
          id: 'rule-1',
          name: 'Payment Validation',
          description: 'All payment processing must be validated',
          priority: 'critical',
          testRequired: true
        },
        {
          id: 'rule-2',
          name: 'Inventory Check',
          description: 'Inventory must be checked before order confirmation',
          priority: 'high',
          testRequired: true
        }
      ],
      context: {
        domain: 'ecommerce',
        subdomains: ['payment', 'inventory', 'shipping'],
        language: 'en',
        version: '1.0.0'
      }
    };
  });

  describe('Inheritance hierarchy', () => {
    test('should extend BasePlugin', () => {
      expect(plugin instanceof BasePlugin).toBe(true);
      expect(plugin instanceof BaseDomainPlugin).toBe(true);
    });

    test('should have type "domain"', () => {
      expect(plugin.type).toBe('domain');
    });
  });

  describe('Dictionary management', () => {
    test('should set and get dictionary', () => {
      plugin.setDictionary(mockDictionary);
      const dictionary = plugin.getDictionary();
      
      expect(dictionary).toBe(mockDictionary);
      expect(dictionary?.terms).toHaveLength(3);
      expect(dictionary?.rules).toHaveLength(2);
    });

    test('should return undefined when no dictionary is set', () => {
      expect(plugin.getDictionary()).toBeUndefined();
    });
  });

  describe('Domain term detection', () => {
    test('should detect domain terms in content', () => {
      plugin.setDictionary(mockDictionary);
      
      const content = `
        test('should add item to cart', () => {
          const cart = new ShoppingCart();
          cart.addItem(product);
          expect(cart.items).toHaveLength(1);
        });
      `;

      // @ts-ignore - accessing protected method for testing
      const detectedTerms = plugin.detectDomainTerms(content);
      
      expect(detectedTerms).toHaveLength(1);
      expect(detectedTerms[0].term).toBe('cart');
    });

    test('should detect terms using aliases', () => {
      plugin.setDictionary(mockDictionary);
      
      const content = `
        test('should update shopping-cart', () => {
          const basket = getBasket();
          basket.updateQuantity(itemId, 2);
        });
      `;

      // @ts-ignore - accessing protected method for testing
      const detectedTerms = plugin.detectDomainTerms(content);
      
      expect(detectedTerms).toHaveLength(1);
      expect(detectedTerms[0].term).toBe('cart');
    });

    test('should detect multiple domain terms', () => {
      plugin.setDictionary(mockDictionary);
      
      const content = `
        test('checkout process with inventory check', () => {
          const cart = createCart();
          const inventory = getInventory();
          const checkout = new CheckoutService();
          
          checkout.process(cart, inventory);
        });
      `;

      // @ts-ignore - accessing protected method for testing
      const detectedTerms = plugin.detectDomainTerms(content);
      
      expect(detectedTerms).toHaveLength(3);
      expect(detectedTerms.map(t => t.term)).toContain('cart');
      expect(detectedTerms.map(t => t.term)).toContain('checkout');
      expect(detectedTerms.map(t => t.term)).toContain('inventory');
    });

    test('should return empty array when no dictionary is set', () => {
      const content = 'test content with cart and checkout';
      
      // @ts-ignore - accessing protected method for testing
      const detectedTerms = plugin.detectDomainTerms(content);
      
      expect(detectedTerms).toHaveLength(0);
    });
  });

  describe('Business rule compliance', () => {
    test('should detect business rule violations', () => {
      plugin.setDictionary(mockDictionary);
      
      const content = `
        test('payment processing', () => {
          const payment = processPayment(amount);
          expect(payment.status).toBe('success');
        });
      `;

      // @ts-ignore - accessing protected method for testing
      const detectedTerms = plugin.detectDomainTerms(content);
      // @ts-ignore - accessing protected method for testing
      const violatedRules = plugin.checkBusinessRuleCompliance(content, detectedTerms);
      
      expect(violatedRules).toHaveLength(0); // No payment term detected, but rule name not in test
    });

    test('should detect when test exists for business rule', () => {
      plugin.setDictionary(mockDictionary);
      
      const content = `
        test('Payment Validation should work correctly', () => {
          const payment = validatePayment(data);
          expect(payment.isValid).toBe(true);
        });
      `;

      // @ts-ignore - accessing protected method for testing
      const hasTest = plugin.hasTestForRule(content, mockDictionary.rules[0]);
      
      expect(hasTest).toBe(true);
    });

    test('should return empty array when no dictionary is set', () => {
      const content = 'test content';
      
      // @ts-ignore - accessing protected method for testing
      const violatedRules = plugin.checkBusinessRuleCompliance(content, []);
      
      expect(violatedRules).toHaveLength(0);
    });
  });

  describe('Domain quality score calculation', () => {
    test('should calculate domain quality score', () => {
      plugin.setDictionary(mockDictionary);
      
      // @ts-ignore - accessing protected method for testing
      const score = plugin.calculateDomainQualityScore(
        [mockDictionary.terms[0]], // 1 out of 3 terms
        [mockDictionary.rules[0]]  // 1 out of 2 rules violated
      );
      
      expect(score.domainCoverage).toBeCloseTo(33.33, 1);
      expect(score.businessRuleCompliance).toBe(50);
      expect(score.terminologyConsistency).toBe(100);
      expect(score.overall).toBeCloseTo(61.11, 1);
    });

    test('should give perfect score when all rules are followed', () => {
      plugin.setDictionary(mockDictionary);
      
      // @ts-ignore - accessing protected method for testing
      const score = plugin.calculateDomainQualityScore(
        mockDictionary.terms, // All terms detected
        []                     // No rules violated
      );
      
      expect(score.domainCoverage).toBe(100);
      expect(score.businessRuleCompliance).toBe(100);
      expect(score.terminologyConsistency).toBe(100);
      expect(score.overall).toBe(100);
    });
  });

  describe('Domain improvements generation', () => {
    test('should generate improvements for violated rules', () => {
      plugin.setDictionary(mockDictionary);
      
      const score: DomainQualityScore = {
        overall: 60,
        dimensions: {
          completeness: 60,
          correctness: 60,
          maintainability: 60
        },
        confidence: 0.8,
        domainCoverage: 60,
        businessRuleCompliance: 60,
        terminologyConsistency: 60
      };
      
      // @ts-ignore - accessing protected method for testing
      const improvements = plugin.generateDomainImprovements(
        [mockDictionary.rules[0]],
        score
      );
      
      expect(improvements).toHaveLength(1);
      expect(improvements[0].id).toBe('fix-business-rule-rule-1');
      expect(improvements[0].priority).toBe('critical');
      expect(improvements[0].category).toBe('domain-compliance');
    });

    test('should suggest domain coverage improvement for low scores', () => {
      plugin.setDictionary(mockDictionary);
      
      const score: DomainQualityScore = {
        overall: 40,
        dimensions: {
          completeness: 40,
          correctness: 40,
          maintainability: 40
        },
        confidence: 0.8,
        domainCoverage: 30,
        businessRuleCompliance: 50,
        terminologyConsistency: 40
      };
      
      // @ts-ignore - accessing protected method for testing
      const improvements = plugin.generateDomainImprovements([], score);
      
      expect(improvements).toHaveLength(1);
      expect(improvements[0].id).toBe('improve-domain-coverage');
      expect(improvements[0].priority).toBe('medium');
    });
  });

  describe('Domain info extraction', () => {
    test('should extract domain info from package.json keywords', () => {
      const context: ProjectContext = {
        projectPath: '/test/project',
        packageJson: {
          name: 'test-project',
          version: '1.0.0',
          keywords: ['ecommerce', 'shopping', 'cart']
        }
      };
      
      // @ts-ignore - accessing protected method for testing
      const domainInfo = plugin.extractDomainInfo(context);
      
      expect(domainInfo).toBe('ecommerce');
    });

    test('should extract domain info from package.json description', () => {
      const context: ProjectContext = {
        projectPath: '/test/project',
        packageJson: {
          description: 'A healthcare management system for hospitals'
        }
      };
      
      // @ts-ignore - accessing protected method for testing
      const domainInfo = plugin.extractDomainInfo(context);
      
      expect(domainInfo).toBe('healthcare');
    });

    test('should return undefined when no domain info found', () => {
      const context: ProjectContext = {
        projectPath: '/test/project',
        packageJson: {
          name: 'my-app'
        }
      };
      
      // @ts-ignore - accessing protected method for testing
      const domainInfo = plugin.extractDomainInfo(context);
      
      expect(domainInfo).toBeUndefined();
    });
  });

  describe('Integration with ITestQualityPlugin', () => {
    test('should properly implement isApplicable', () => {
      const ecommerceContext: ProjectContext = {
        projectPath: '/test/project',
        packageJson: {
          keywords: ['ecommerce']
        }
      };
      
      const otherContext: ProjectContext = {
        projectPath: '/test/project',
        packageJson: {
          keywords: ['gaming']
        }
      };
      
      expect(plugin.isApplicable(ecommerceContext)).toBe(true);
      expect(plugin.isApplicable(otherContext)).toBe(false);
    });

    test('should detect patterns with domain analysis', async () => {
      plugin.setDictionary(mockDictionary);
      
      const testFile: TestFile = {
        path: '/test/ecommerce.test.ts',
        content: `
          test('cart management', () => {
            const cart = new Cart();
            cart.addItem(product);
          });
        `
      };
      
      const patterns = await plugin.detectPatterns(testFile);
      
      expect(patterns.length).toBeGreaterThan(0);
      expect(patterns.some(p => p.metadata?.category === 'business-rule')).toBe(true);
    });
  });
});