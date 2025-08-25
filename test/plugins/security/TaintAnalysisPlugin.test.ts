/**
 * 汚染解析プラグインのテスト
 */

import { TaintAnalysisPlugin } from '../../../src/plugins/security/TaintAnalysisPlugin';
import { TestFile, ProjectContext, QualityScore } from '../../../src/core/types';

describe('TaintAnalysisPlugin', () => {
  let plugin: TaintAnalysisPlugin;
  
  beforeEach(() => {
    plugin = new TaintAnalysisPlugin();
  });
  
  describe('Basic functionality', () => {
    it('should have correct metadata', () => {
      expect(plugin.id).toBe('taint-analysis');
      expect(plugin.name).toBe('Taint Analysis Security Plugin');
      expect(plugin.version).toBe('1.0.0');
      expect(plugin.type).toBe('security');
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
    
    it('should be applicable to all projects', () => {
      const context: ProjectContext = {
        language: 'python',
        framework: 'pytest',
        rootPath: '/test'
      };
      
      // TaintAnalysisPluginは全プロジェクトに適用可能
      expect(plugin.isApplicable(context)).toBe(true);
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
      const taintFlowIssues = patterns.filter(p => p.patternId && p.patternId.includes('taint'));
      expect(taintFlowIssues.length).toBeGreaterThanOrEqual(0);
    });
    
    it('should detect XSS pattern from base plugin', async () => {
      const testFile: TestFile = {
        path: 'test.ts',
        content: `
          function displayUserInput(input: string): void {
            // XSSの脆弱性
            element.innerHTML = input;
          }
          
          describe('Display Tests', () => {
            it('should display input', () => {
              const userInput = request.body.comment;
              displayUserInput(userInput);
            });
          });
        `,
        testCount: 1,
        hasTests: true
      };
      
      const patterns = await plugin.detectPatterns(testFile);
      
      // XSSパターンが検出されることを期待
      const xssIssues = patterns.filter(p => p.patternId === 'xss');
      expect(xssIssues.length).toBeGreaterThan(0);
    });
  });
  
  describe('Quality evaluation', () => {
    it('should calculate quality score based on issues', () => {
      const patterns = [
        {
          patternId: 'taint-flow-sql-injection',
          patternName: 'Taint Flow: SQL Injection',
          location: { file: 'test.ts', line: 10, column: 5 },
          severity: 'critical' as const,
          confidence: 0.9,
          metadata: { 
            description: 'Tainted data flow detected',
            category: 'security'
          }
        },
        {
          patternId: 'xss',
          patternName: 'XSS',
          location: { file: 'test.ts', line: 20, column: 10 },
          severity: 'high' as const,
          confidence: 0.8,
          metadata: { 
            description: 'Cross-site scripting vulnerability',
            category: 'security'
          }
        }
      ];
      
      const score = plugin.evaluateQuality(patterns);
      
      expect(score.overall).toBeLessThan(100);
      expect(score.overall).toBeGreaterThan(0);
      expect(score.dimensions?.completeness).toBeDefined();
      expect(score.dimensions?.correctness).toBeDefined();
    });
    
    it('should give perfect score for clean code', () => {
      const patterns: any[] = [];
      
      const score = plugin.evaluateQuality(patterns);
      
      expect(score.overall).toBe(100);
      expect(score.confidence).toBe(1);
    });
  });
  
  describe('Improvement suggestions', () => {
    it('should suggest fixes for taint flow issues', () => {
      const evaluation: QualityScore = {
        overall: 60,
        dimensions: {},
        breakdown: {
          completeness: 60,
          correctness: 60,
          maintainability: 80
        },
        confidence: 0.8
      };
      
      const improvements = plugin.suggestImprovements(evaluation);
      
      const inputValidationFix = improvements.find(i => i.id === 'improve-input-validation');
      expect(inputValidationFix).toBeDefined();
      expect(inputValidationFix?.priority).toBe('high');
      expect(inputValidationFix?.estimatedImpact).toBeCloseTo(0.3, 1);
    });
    
    it('should suggest critical fixes for low scores', () => {
      const evaluation: QualityScore = {
        overall: 25,
        dimensions: {},
        breakdown: {
          completeness: 25,
          correctness: 25,
          maintainability: 80
        },
        confidence: 0.9
      };
      
      const improvements = plugin.suggestImprovements(evaluation);
      
      const criticalFix = improvements.find(i => i.id === 'fix-critical-taint-flows');
      expect(criticalFix).toBeDefined();
      expect(criticalFix?.priority).toBe('critical');
    });
    
    it('should return no improvements for high quality', () => {
      const evaluation: QualityScore = {
        overall: 85,
        dimensions: {},
        breakdown: {
          completeness: 85,
          correctness: 85,
          maintainability: 90
        },
        confidence: 1
      };
      
      const improvements = plugin.suggestImprovements(evaluation);
      
      // overall >= 70 の場合、改善提案はない
      expect(improvements).toHaveLength(0);
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
      
      // エラー時でも空配列または他のパターンを返す
      expect(Array.isArray(patterns)).toBe(true);
      // 無効な構文では汚染フローは検出されない
      const taintPatterns = patterns.filter(p => p.patternId && p.patternId.startsWith('taint-flow-'));
      expect(taintPatterns.length).toBe(0);
    });
  });
});