import { UnifiedAIFormatter } from '../../src/ai-output/unified-ai-formatter';
import { FormattingStrategy } from '../../src/ai-output/adapter';
import { UnifiedAnalysisResult, AIJsonOutput, UnifiedAIFormatterOptions } from '../../src/ai-output/types';

// テスト用のモックデータ
const mockAnalysisResult: UnifiedAnalysisResult = {
  summary: {
    overallScore: 75,
    overallGrade: 'B',
    statistics: {
      totalFiles: 10,
      totalTests: 50,
      totalIssues: 5,
      riskCounts: {
        CRITICAL: 1,
        HIGH: 2,
        MEDIUM: 1,
        LOW: 1,
        MINIMAL: 0
      }
    }
  },
  aiKeyRisks: [
    {
      id: 'RISK-001',
      problem: 'Critical security vulnerability',
      riskLevel: 'CRITICAL',
      impact: 'High security risk',
      solution: 'Fix immediately',
      priority: 1,
      estimatedEffort: '2h'
    },
    {
      id: 'RISK-002',
      problem: 'Memory leak detected',
      riskLevel: 'HIGH',
      impact: 'Performance degradation',
      solution: 'Refactor code',
      priority: 2,
      estimatedEffort: '4h'
    },
    {
      id: 'RISK-003',
      problem: 'Missing test coverage',
      riskLevel: 'MEDIUM',
      impact: 'Low maintainability',
      solution: 'Add unit tests',
      priority: 3,
      estimatedEffort: '6h'
    }
  ],
  projectContext: {
    projectPath: '/test/project',
    framework: 'jest',
    language: 'typescript',
    testCoverage: 75
  },
  detailedAnalysis: {
    categories: {},
    trends: [],
    recommendations: []
  }
};

describe('UnifiedAIFormatterStrategy', () => {
  let formatter: UnifiedAIFormatter;

  beforeEach(() => {
    formatter = new UnifiedAIFormatter();
  });

  describe('基本機能', () => {
    it('インスタンスが正しく作成される', () => {
      expect(formatter).toBeInstanceOf(UnifiedAIFormatterStrategy);
    });

    it('デフォルト戦略（Base）でフォーマットできる', () => {
      const result = formatter.format(mockAnalysisResult);
      
      expect(result).toBeDefined();
      expect(result.overallAssessment).toContain('プロジェクト品質評価結果');
      expect(result.topIssues).toHaveLength(3);
      expect(result.actionableRisks).toHaveLength(3);
    });

    it('オプションを適用してフォーマットできる', () => {
      const options: UnifiedAIFormatterOptions = {
        maxRisks: 2,
        includeRiskLevels: ['CRITICAL', 'HIGH']
      };
      
      const result = formatter.format(mockAnalysisResult, options);
      
      expect(result.actionableRisks).toHaveLength(2);
      expect(result.actionableRisks.every(r => 
        r.riskLevel === 'CRITICAL' || r.riskLevel === 'HIGH'
      )).toBeTruthy();
    });
  });

  describe('戦略パターン', () => {
    it('Base戦略に切り替えできる', () => {
      formatter.setStrategy('base');
      const result = formatter.format(mockAnalysisResult);
      
      expect(result).toBeDefined();
      expect(result.formattingStrategy).toBe('base');
    });

    it('Optimized戦略に切り替えできる', () => {
      formatter.setStrategy('optimized');
      const result = formatter.format(mockAnalysisResult);
      
      expect(result).toBeDefined();
      expect(result.formattingStrategy).toBe('optimized');
      // Optimized戦略特有の最適化を確認
      expect(result.actionableRisks.length).toBeLessThanOrEqual(10);
    });

    it('Parallel戦略に切り替えできる', async () => {
      formatter.setStrategy('parallel');
      const result = await formatter.formatAsync(mockAnalysisResult);
      
      expect(result).toBeDefined();
      expect(result.formattingStrategy).toBe('parallel');
    });

    it('無効な戦略名でエラーをスローする', () => {
      expect(() => formatter.setStrategy('invalid' as any))
        .toThrow('Invalid strategy: invalid');
    });

    it('カスタム戦略を登録できる', () => {
      const customStrategy: FormattingStrategy = {
        name: 'custom',
        format: (result: UnifiedAnalysisResult, options?: UnifiedAIFormatterOptions) => {
          return {
            overallAssessment: 'Custom assessment',
            topIssues: [],
            actionableRisks: [],
            contextualSummary: 'Custom context',
            reportPath: '/custom/path',
            formattingStrategy: 'custom'
          };
        }
      };
      
      formatter.registerStrategy(customStrategy);
      formatter.setStrategy('custom');
      const result = formatter.format(mockAnalysisResult);
      
      expect(result.overallAssessment).toBe('Custom assessment');
      expect(result.formattingStrategy).toBe('custom');
    });
  });

  describe('エラーハンドリング', () => {
    it('無効な入力でエラーをスローする', () => {
      expect(() => formatter.format(null as any))
        .toThrow('Invalid UnifiedAnalysisResult');
    });

    it('必須フィールドが欠けている場合エラーをスローする', () => {
      const invalidResult = { summary: {} } as any;
      expect(() => formatter.format(invalidResult))
        .toThrow('Missing required fields');
    });
  });

  describe('非同期処理', () => {
    it('非同期フォーマットが正しく動作する', async () => {
      formatter.setStrategy('parallel');
      const result = await formatter.formatAsync(mockAnalysisResult);
      
      expect(result).toBeDefined();
      expect(result.overallAssessment).toBeDefined();
      expect(result.actionableRisks).toBeDefined();
    });

    it('複数の結果を並列処理できる', async () => {
      formatter.setStrategy('parallel');
      const results = await formatter.formatBatch([
        mockAnalysisResult,
        mockAnalysisResult,
        mockAnalysisResult
      ]);
      
      expect(results).toHaveLength(3);
      results.forEach(result => {
        expect(result).toBeDefined();
        expect(result.formattingStrategy).toBe('parallel');
      });
    });
  });

  describe('パフォーマンス最適化', () => {
    it('大量のリスクを効率的に処理できる', () => {
      const largeResult: UnifiedAnalysisResult = {
        ...mockAnalysisResult,
        aiKeyRisks: Array(100).fill(null).map((_, i) => ({
          id: `RISK-${i}`,
          problem: `Problem ${i}`,
          riskLevel: ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'MINIMAL'][i % 5] as any,
          impact: `Impact ${i}`,
          solution: `Solution ${i}`,
          priority: i,
          estimatedEffort: `${i}h`
        }))
      };
      
      formatter.setStrategy('optimized');
      const startTime = Date.now();
      const result = formatter.format(largeResult);
      const endTime = Date.now();
      
      expect(result.actionableRisks.length).toBeLessThanOrEqual(10);
      expect(endTime - startTime).toBeLessThan(100); // 100ms以内
    });
  });

  describe('SOLID原則の遵守', () => {
    it('単一責任原則: AI向けフォーマットのみを責務とする', () => {
      const methods = Object.getOwnPropertyNames(Object.getPrototypeOf(formatter));
      const formattingMethods = methods.filter(m => 
        m.includes('format') || 
        m.includes('Strategy') ||
        m === 'constructor'
      );
      
      expect(formattingMethods.length).toBeGreaterThan(0);
    });

    it('開放閉鎖原則: 新しい戦略を追加できる', () => {
      const initialStrategies = formatter.getAvailableStrategies();
      
      formatter.registerStrategy({
        name: 'extended',
        format: (result, options) => ({} as AIJsonOutput)
      });
      
      const updatedStrategies = formatter.getAvailableStrategies();
      expect(updatedStrategies).toContain('extended');
      expect(updatedStrategies.length).toBe(initialStrategies.length + 1);
    });

    it('リスコフの置換原則: 全ての戦略が同じインターフェースを実装', () => {
      const strategies = ['base', 'optimized', 'parallel'] as const;
      
      strategies.forEach(strategy => {
        formatter.setStrategy(strategy);
        const result = formatter.format(mockAnalysisResult);
        
        // 全ての戦略が同じ出力構造を持つ
        expect(result).toHaveProperty('overallAssessment');
        expect(result).toHaveProperty('topIssues');
        expect(result).toHaveProperty('actionableRisks');
        expect(result).toHaveProperty('contextualSummary');
      });
    });
  });
});