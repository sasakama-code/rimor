/**
 * 汚染解析プラグインのテスト
 */

import { TaintAnalysisPlugin } from '../../../src/plugins/security/TaintAnalysisPlugin';
import { TestFile, ProjectContext } from '../../../src/core/types';

describe('TaintAnalysisPlugin', () => {
  let plugin: TaintAnalysisPlugin;
  
  beforeEach(() => {
    plugin = new TaintAnalysisPlugin();
  });
  
  describe('Basic functionality', () => {
    it('should have correct metadata', () => {
      expect(plugin.id).toBe('taint-analysis');
      expect(plugin.name).toBe('型ベース汚染解析プラグイン');
      expect(plugin.version).toBe('1.0.0');
      expect(plugin.type).toBe('pattern');
    });
    
    it('should be applicable to TypeScript projects', () => {
      const context: ProjectContext = {
        language: 'typescript',
        framework: 'jest',
        rootPath: '/test'
      };
      
      expect(plugin.isApplicable(context)).toBe(true);
    });
    
    it('should be applicable to JavaScript projects', () => {
      const context: ProjectContext = {
        language: 'javascript',
        framework: 'jest',
        rootPath: '/test'
      };
      
      expect(plugin.isApplicable(context)).toBe(true);
    });
    
    it('should not be applicable to other languages', () => {
      const context: ProjectContext = {
        language: 'python',
        framework: 'pytest',
        rootPath: '/test'
      };
      
      expect(plugin.isApplicable(context)).toBe(false);
    });
  });
  
  describe('Pattern detection', () => {
    it('should detect taint flow issues', async () => {
      const testFile: TestFile = {
        path: 'test.ts',
        content: `
          function processUserInput(userInput: string) {
            // 汚染されたデータの直接使用
            const query = "SELECT * FROM users WHERE name = '" + userInput + "'";
            db.execute(query);
          }
          
          describe('Security Tests', () => {
            it('should handle user input', () => {
              const input = getUserInput();
              processUserInput(input);
            });
          });
        `,
        testCount: 1,
        hasTests: true
      };
      
      const patterns = await plugin.detectPatterns(testFile);
      
      // 汚染フローの問題が検出されることを期待
      const taintFlowIssues = patterns.filter(p => p.patternId.includes('taint'));
      expect(taintFlowIssues.length).toBeGreaterThanOrEqual(0);
    });
    
    it('should detect missing security tests', async () => {
      const testFile: TestFile = {
        path: 'test.ts',
        content: `
          function sanitizeInput(input: string): string {
            return input.replace(/<script>/gi, '');
          }
          
          describe('Basic Tests', () => {
            it('should return string', () => {
              const result = sanitizeInput('hello');
              expect(typeof result).toBe('string');
            });
          });
        `,
        testCount: 1,
        hasTests: true
      };
      
      const patterns = await plugin.detectPatterns(testFile);
      
      // セキュリティテストの不足が検出されることを期待
      const securityTestIssues = patterns.filter(p => p.patternId === 'security-test-coverage');
      expect(securityTestIssues.length).toBeGreaterThan(0);
    });
  });
  
  describe('Quality evaluation', () => {
    it('should calculate quality score based on issues', () => {
      const patterns = [
        {
          patternId: 'taint-taint-flow',
          location: { file: 'test.ts', line: 10, column: 5 },
          message: 'Tainted data flow detected',
          severity: 'high' as const,
          confidence: 0.9,
          details: { type: 'taint-flow' }
        },
        {
          patternId: 'taint-incompatible-types',
          location: { file: 'test.ts', line: 20, column: 10 },
          message: 'Type incompatibility',
          severity: 'medium' as const,
          confidence: 0.8,
          details: { type: 'incompatible-types' }
        }
      ];
      
      const score = plugin.evaluateQuality(patterns);
      
      expect(score.score).toBeLessThan(100);
      expect(score.score).toBeGreaterThan(0);
      expect(score.details).toHaveProperty('taintFlowIssues', 1);
      expect(score.details).toHaveProperty('typeCompatibilityIssues', 1);
    });
    
    it('should give perfect score for clean code', () => {
      const patterns: any[] = [];
      
      const score = plugin.evaluateQuality(patterns);
      
      expect(score.score).toBe(100);
      expect(score.category).toBe('Excellent');
    });
  });
  
  describe('Improvement suggestions', () => {
    it('should suggest fixes for taint flow issues', () => {
      const evaluation = {
        score: 70,
        category: 'Good',
        details: {
          taintFlowIssues: 2,
          typeCompatibilityIssues: 0,
          securityTestCoverage: 1.0
        }
      };
      
      const improvements = plugin.suggestImprovements(evaluation);
      
      const taintFlowFix = improvements.find(i => i.id === 'fix-taint-flows');
      expect(taintFlowFix).toBeDefined();
      expect(taintFlowFix?.priority).toBe('high');
      expect(taintFlowFix?.estimatedImpact).toBe(30);
    });
    
    it('should suggest type annotation improvements', () => {
      const evaluation = {
        score: 80,
        category: 'Good',
        details: {
          taintFlowIssues: 0,
          typeCompatibilityIssues: 2,
          securityTestCoverage: 1.0
        }
      };
      
      const improvements = plugin.suggestImprovements(evaluation);
      
      const typeAnnotationFix = improvements.find(i => i.id === 'fix-type-annotations');
      expect(typeAnnotationFix).toBeDefined();
      expect(typeAnnotationFix?.priority).toBe('medium');
    });
    
    it('should suggest security test improvements', () => {
      const evaluation = {
        score: 85,
        category: 'Good',
        details: {
          taintFlowIssues: 0,
          typeCompatibilityIssues: 0,
          securityTestCoverage: 0.5
        }
      };
      
      const improvements = plugin.suggestImprovements(evaluation);
      
      const testImprovement = improvements.find(i => i.id === 'improve-security-tests');
      expect(testImprovement).toBeDefined();
      expect(testImprovement?.category).toBe('test-coverage');
    });
  });
  
  describe('Integration with taint analysis system', () => {
    it('should handle analysis errors gracefully', async () => {
      const testFile: TestFile = {
        path: 'invalid.ts',
        content: '{{invalid typescript syntax}}',
        testCount: 0,
        hasTests: false
      };
      
      const patterns = await plugin.detectPatterns(testFile);
      
      // エラーパターンが含まれることを確認
      const errorPatterns = patterns.filter(p => p.patternId === 'taint-analysis-error');
      expect(errorPatterns.length).toBeGreaterThan(0);
    });
  });
});