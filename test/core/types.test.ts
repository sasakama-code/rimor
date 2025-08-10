/**
 * 型定義のテスト
 * Issue #66: テストカバレッジの向上
 * TDD RED段階: 失敗するテストファースト
 */

import {
  // Base types
  Issue,
  SeverityLevel,
  Position,
  
  // Plugin types
  IPlugin,
  ITestQualityPlugin,
  PluginType,
  DetectionResult,
  
  // Project context types
  ProjectContext,
  TestFile,
  TestMethod,
  
  // Quality score types
  QualityScore,
  QualityDimension,
  
  // Analysis types
  AnalysisResult,
  ProjectAnalysisResult,
  TestAnalysisResult,
  
  // Type guards
  isIssue,
  isIPlugin,
  isITestQualityPlugin,
  isQualityScore,
  isAnalysisResult,
  isProjectContext,
  isTestFile,
  isDetectionResult
} from '../../src/core/types';

describe('Type Definitions', () => {
  describe('Type Guards', () => {
    describe('isIssue', () => {
      it('有効なIssueオブジェクトを正しく判定する', () => {
        // Arrange
        const validIssue: Issue = {
          type: 'error',
          file: 'test.ts',
          line: 10,
          column: 5,
          severity: 'high' as SeverityLevel,
          message: 'Test issue',
          rule: 'test-rule'
        };

        // Act & Assert
        expect(isIssue(validIssue)).toBe(true);
      });

      it('無効なオブジェクトをfalseと判定する', () => {
        // Arrange
        const invalidIssue = {
          file: 'test.ts',
          // lineが欠けている
          column: 5,
          severity: 'high',
          message: 'Test issue'
        };

        // Act & Assert
        expect(isIssue(invalidIssue)).toBe(false);
      });

      it('nullやundefinedをfalseと判定する', () => {
        expect(isIssue(null)).toBe(false);
        expect(isIssue(undefined)).toBe(false);
      });
    });

    describe('isIPlugin', () => {
      it('有効なIPluginオブジェクトを正しく判定する', () => {
        // Arrange
        const validPlugin: IPlugin = {
          name: 'TestPlugin',
          analyze: jest.fn()
        };

        // Act & Assert
        expect(isIPlugin(validPlugin)).toBe(true);
      });

      it('analyzeメソッドがない場合はfalseと判定する', () => {
        // Arrange
        const invalidPlugin = {
          name: 'TestPlugin'
          // analyzeメソッドがない
        };

        // Act & Assert
        expect(isIPlugin(invalidPlugin)).toBe(false);
      });
    });

    describe('isITestQualityPlugin', () => {
      it('有効なITestQualityPluginオブジェクトを正しく判定する', () => {
        // Arrange
        const validPlugin: ITestQualityPlugin = {
          id: 'test-plugin',
          name: 'Test Plugin',
          version: '1.0.0',
          type: 'core' as PluginType,
          isApplicable: jest.fn(),
          detectPatterns: jest.fn(),
          evaluateQuality: jest.fn(),
          suggestImprovements: jest.fn()
        };

        // Act & Assert
        expect(isITestQualityPlugin(validPlugin)).toBe(true);
      });

      it('必須メソッドが欠けている場合はfalseと判定する', () => {
        // Arrange
        const invalidPlugin = {
          id: 'test-plugin',
          name: 'Test Plugin',
          version: '1.0.0',
          type: 'core',
          isApplicable: jest.fn()
          // detectPatterns, evaluateQuality, suggestImprovementsが欠けている
        };

        // Act & Assert
        expect(isITestQualityPlugin(invalidPlugin)).toBe(false);
      });
    });

    describe('isQualityScore', () => {
      it('有効なQualityScoreオブジェクトを正しく判定する', () => {
        // Arrange
        const validScore: QualityScore = {
          overall: 0.85,
          dimensions: {
            completeness: 0.90,
            correctness: 0.85,
            maintainability: 0.80,
            performance: 0.85,
            security: 0.90
          },
          confidence: 0.95
        };

        // Act & Assert
        expect(isQualityScore(validScore)).toBe(true);
      });

      it('overallが範囲外の場合はfalseと判定する', () => {
        // Arrange
        const invalidScore = {
          overall: 1.5, // 範囲外
          dimensions: {
            completeness: 0.90
          },
          confidence: 0.95
        };

        // Act & Assert
        expect(isQualityScore(invalidScore)).toBe(false);
      });
    });

    describe('isProjectContext', () => {
      it('有効なProjectContextオブジェクトを正しく判定する', () => {
        // Arrange
        const validContext: ProjectContext = {
          projectRoot: '/path/to/project',
          framework: 'jest',
          language: 'typescript',
          testFiles: [],
          sourceFiles: []
        };

        // Act & Assert
        expect(isProjectContext(validContext)).toBe(true);
      });

      it('必須プロパティが欠けている場合はfalseと判定する', () => {
        // Arrange
        const invalidContext = {
          projectRoot: '/path/to/project',
          // frameworkが欠けている
          language: 'typescript',
          testFiles: [],
          sourceFiles: []
        };

        // Act & Assert
        expect(isProjectContext(invalidContext)).toBe(false);
      });
    });
  });

  describe('Type Validation', () => {
    it('SeverityLevelが正しい値を持つ', () => {
      // Arrange
      const validLevels: SeverityLevel[] = ['low', 'medium', 'high', 'critical'];

      // Act & Assert
      validLevels.forEach(level => {
        expect(['low', 'medium', 'high', 'critical']).toContain(level);
      });
    });

    it('PluginTypeが正しい値を持つ', () => {
      // Arrange
      const validTypes: PluginType[] = ['core', 'framework', 'pattern', 'domain'];

      // Act & Assert
      validTypes.forEach(type => {
        expect(['core', 'framework', 'pattern', 'domain']).toContain(type);
      });
    });

    it('QualityDimensionが正しい値を持つ', () => {
      // Arrange
      const validDimensions: QualityDimension[] = [
        'completeness',
        'correctness',
        'maintainability',
        'performance',
        'security'
      ];

      // Act & Assert
      validDimensions.forEach(dimension => {
        expect([
          'completeness',
          'correctness',
          'maintainability',
          'performance',
          'security'
        ]).toContain(dimension);
      });
    });
  });

  describe('Complex Type Guards', () => {
    describe('isTestFile', () => {
      it('有効なTestFileオブジェクトを正しく判定する', () => {
        // Arrange
        const validTestFile: TestFile = {
          path: '/test/example.test.ts',
          content: 'test content'
        };

        // Act & Assert
        expect(isTestFile(validTestFile)).toBe(true);
      });

      it('metadataを持つTestFileを正しく判定する', () => {
        // Arrange
        const testFileWithMetadata: TestFile = {
          path: '/test/example.test.ts',
          content: 'test content',
          framework: 'jest',
          testCount: 5
        };

        // Act & Assert
        expect(isTestFile(testFileWithMetadata)).toBe(true);
      });
    });

    describe('isDetectionResult', () => {
      it('有効なDetectionResultオブジェクトを正しく判定する', () => {
        // Arrange
        const validResult: DetectionResult = {
          pattern: 'test-pattern',
          confidence: 0.95,
          location: {
            file: 'test.ts',
            line: 10,
            column: 5
          }
        };

        // Act & Assert
        expect(isDetectionResult(validResult)).toBe(true);
      });

      it('confidenceが範囲外の場合はfalseと判定する', () => {
        // Arrange
        const invalidResult = {
          pattern: 'test-pattern',
          confidence: 1.5, // 範囲外
          location: {
            file: 'test.ts',
            line: 10,
            column: 5
          },
          details: {}
        };

        // Act & Assert
        expect(isDetectionResult(invalidResult)).toBe(false);
      });
    });

    describe('isAnalysisResult', () => {
      it('有効なAnalysisResultオブジェクトを正しく判定する', () => {
        // Arrange
        const validResult: AnalysisResult = {
          projectRoot: '/project',
          timestamp: new Date(),
          results: [],
          summary: {
            totalFiles: 10,
            filesWithIssues: 3,
            totalIssues: 5
          }
        };

        // Act & Assert
        expect(isAnalysisResult(validResult)).toBe(true);
      });

      it('summaryが不完全な場合はfalseと判定する', () => {
        // Arrange
        const invalidResult = {
          projectRoot: '/project',
          timestamp: new Date(),
          results: [],
          summary: {
            totalFiles: 10
            // filesWithIssues, totalIssuesが欠けている
          }
        };

        // Act & Assert
        expect(isAnalysisResult(invalidResult)).toBe(false);
      });
    });
  });

  describe('Edge Cases', () => {
    it('循環参照を含むオブジェクトを適切に処理する', () => {
      // Arrange
      const circular: any = { name: 'test' };
      circular.self = circular;

      // Act & Assert
      expect(() => isIPlugin(circular)).not.toThrow();
      expect(isIPlugin(circular)).toBe(false);
    });

    it('Proxyオブジェクトを適切に処理する', () => {
      // Arrange
      const target = {
        name: 'TestPlugin',
        analyze: jest.fn()
      };
      const proxy = new Proxy(target, {});

      // Act & Assert
      expect(isIPlugin(proxy)).toBe(true);
    });

    it('凍結されたオブジェクトを適切に処理する', () => {
      // Arrange
      const frozen = Object.freeze({
        name: 'TestPlugin',
        analyze: jest.fn()
      });

      // Act & Assert
      expect(isIPlugin(frozen)).toBe(true);
    });
  });
});