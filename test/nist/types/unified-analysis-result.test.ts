/**
 * UnifiedAnalysisResult v2.0 型定義テスト
 * Issue #52の要件に準拠
 * 
 * TDD Red Phase: 失敗するテストを最初に作成
 * SOLID原則: インターフェース分離の原則に従う
 */

import {
  UnifiedAnalysisResult,
  ExecutiveSummary,
  DetailedIssue,
  AIActionableRisk,
  ReportDimension,
  ScoreBreakdown,
  RiskLevel,
  AIActionType
} from '../../../src/nist/types/unified-analysis-result';

describe('UnifiedAnalysisResult v2.0', () => {
  describe('RiskLevel Enum', () => {
    it('大文字のリスクレベルを定義する', () => {
      expect(RiskLevel.CRITICAL).toBe('CRITICAL');
      expect(RiskLevel.HIGH).toBe('HIGH');
      expect(RiskLevel.MEDIUM).toBe('MEDIUM');
      expect(RiskLevel.LOW).toBe('LOW');
      expect(RiskLevel.MINIMAL).toBe('MINIMAL');
    });

    it('すべての必要なリスクレベルが存在する', () => {
      const levels = Object.values(RiskLevel);
      expect(levels).toHaveLength(5);
      expect(levels).toContain('CRITICAL');
      expect(levels).toContain('HIGH');
      expect(levels).toContain('MEDIUM');
      expect(levels).toContain('LOW');
      expect(levels).toContain('MINIMAL');
    });
  });

  describe('AIActionType Enum', () => {
    it('AIエージェント向けアクションタイプを定義する', () => {
      expect(AIActionType.ADD_ASSERTION).toBe('ADD_ASSERTION');
      expect(AIActionType.SANITIZE_VARIABLE).toBe('SANITIZE_VARIABLE');
      expect(AIActionType.REFACTOR_COMPLEX_CODE).toBe('REFACTOR_COMPLEX_CODE');
      expect(AIActionType.ADD_MISSING_TEST).toBe('ADD_MISSING_TEST');
    });
  });

  describe('ScoreBreakdown Interface', () => {
    it('スコア内訳の構造を検証する', () => {
      const breakdown: ScoreBreakdown = {
        label: 'クリティカルリスク',
        calculation: '-5点 x 21件',
        deduction: -105
      };

      expect(breakdown.label).toBeDefined();
      expect(breakdown.calculation).toBeDefined();
      expect(breakdown.deduction).toBeDefined();
      expect(typeof breakdown.deduction).toBe('number');
    });
  });

  describe('ReportDimension Interface', () => {
    it('評価ディメンションの構造を検証する', () => {
      const dimension: ReportDimension = {
        name: 'テスト意図実現度',
        score: 85,
        weight: 0.3,
        impact: 25.5,
        breakdown: [
          {
            label: 'アサーション不足',
            calculation: '-2点 x 5件',
            deduction: -10
          }
        ]
      };

      expect(dimension.name).toBeDefined();
      expect(dimension.score).toBeGreaterThanOrEqual(0);
      expect(dimension.score).toBeLessThanOrEqual(100);
      expect(dimension.weight).toBeGreaterThanOrEqual(0);
      expect(dimension.weight).toBeLessThanOrEqual(1);
      expect(dimension.impact).toBe(dimension.score * dimension.weight);
      expect(dimension.breakdown).toBeInstanceOf(Array);
    });
  });

  describe('ExecutiveSummary Interface', () => {
    it('サマリー情報の構造を検証する', () => {
      const summary: ExecutiveSummary = {
        overallScore: 72,
        overallGrade: 'B',
        dimensions: [
          {
            name: 'セキュリティリスク',
            score: 68,
            weight: 0.4,
            impact: 27.2,
            breakdown: []
          }
        ],
        statistics: {
          totalFiles: 150,
          totalTests: 230,
          riskCounts: {
            CRITICAL: 5,
            HIGH: 12,
            MEDIUM: 23,
            LOW: 45,
            MINIMAL: 30
          }
        }
      };

      expect(summary.overallScore).toBeDefined();
      expect(['A', 'B', 'C', 'D', 'F']).toContain(summary.overallGrade);
      expect(summary.dimensions).toBeInstanceOf(Array);
      expect(summary.statistics).toBeDefined();
      expect(summary.statistics.riskCounts).toBeDefined();
      expect(Object.keys(summary.statistics.riskCounts)).toHaveLength(5);
    });

    it('グレードの妥当性を検証する', () => {
      const gradeTests = [
        { score: 95, expectedGrade: 'A' },
        { score: 85, expectedGrade: 'B' },
        { score: 75, expectedGrade: 'C' },
        { score: 65, expectedGrade: 'D' },
        { score: 50, expectedGrade: 'F' }
      ];

      gradeTests.forEach(test => {
        const summary: ExecutiveSummary = {
          overallScore: test.score,
          overallGrade: test.expectedGrade as 'A' | 'B' | 'C' | 'D' | 'F',
          dimensions: [],
          statistics: {
            totalFiles: 0,
            totalTests: 0,
            riskCounts: {
              CRITICAL: 0,
              HIGH: 0,
              MEDIUM: 0,
              LOW: 0,
              MINIMAL: 0
            }
          }
        };
        
        expect(['A', 'B', 'C', 'D', 'F']).toContain(summary.overallGrade);
      });
    });
  });

  describe('DetailedIssue Interface', () => {
    it('詳細な問題情報の構造を検証する', () => {
      const issue: DetailedIssue = {
        filePath: '/src/auth/login.ts',
        startLine: 42,
        endLine: 58,
        riskLevel: RiskLevel.CRITICAL,
        title: 'SQLインジェクションの脆弱性',
        description: 'ユーザー入力が直接SQLクエリに使用されています',
        contextSnippet: 'const query = `SELECT * FROM users WHERE id = ${userId}`'
      };

      expect(issue.filePath).toBeDefined();
      expect(issue.startLine).toBeGreaterThan(0);
      expect(issue.endLine).toBeGreaterThanOrEqual(issue.startLine);
      expect(Object.values(RiskLevel)).toContain(issue.riskLevel);
      expect(issue.title).toBeDefined();
      expect(issue.description).toBeDefined();
    });
  });

  describe('AIActionableRisk Interface', () => {
    it('AI向けアクション可能なリスク情報の構造を検証する', () => {
      const risk: AIActionableRisk = {
        riskId: 'SQL-INJ-001',
        filePath: '/src/auth/login.ts',
        riskLevel: RiskLevel.CRITICAL,
        title: 'SQLインジェクションの脆弱性',
        problem: 'ユーザー入力がサニタイズされずにSQLクエリに使用',
        context: {
          codeSnippet: 'const query = `SELECT * FROM users WHERE id = ${userId}`',
          startLine: 42,
          endLine: 43
        },
        suggestedAction: {
          type: AIActionType.SANITIZE_VARIABLE,
          description: 'パラメータ化クエリを使用してください',
          example: 'const query = "SELECT * FROM users WHERE id = ?"; db.query(query, [userId]);'
        }
      };

      expect(risk.riskId).toBeDefined();
      expect(risk.filePath).toBeDefined();
      expect(Object.values(RiskLevel)).toContain(risk.riskLevel);
      expect(risk.title).toBeDefined();
      expect(risk.problem).toBeDefined();
      expect(risk.context).toBeDefined();
      expect(risk.context.codeSnippet).toBeDefined();
      expect(risk.context.startLine).toBeGreaterThan(0);
      expect(risk.suggestedAction).toBeDefined();
      expect(Object.values(AIActionType)).toContain(risk.suggestedAction.type);
    });
  });

  describe('UnifiedAnalysisResult Interface', () => {
    it('統一分析結果の完全な構造を検証する', () => {
      const result: UnifiedAnalysisResult = {
        schemaVersion: '1.0',
        summary: {
          overallScore: 78,
          overallGrade: 'C',
          dimensions: [
            {
              name: 'テスト意図実現度',
              score: 82,
              weight: 0.3,
              impact: 24.6,
              breakdown: []
            },
            {
              name: 'セキュリティリスク',
              score: 65,
              weight: 0.5,
              impact: 32.5,
              breakdown: []
            }
          ],
          statistics: {
            totalFiles: 100,
            totalTests: 150,
            riskCounts: {
              CRITICAL: 3,
              HIGH: 8,
              MEDIUM: 15,
              LOW: 25,
              MINIMAL: 20
            }
          }
        },
        detailedIssues: [
          {
            filePath: '/src/api/user.ts',
            startLine: 10,
            endLine: 20,
            riskLevel: RiskLevel.HIGH,
            title: '認証バイパスの可能性',
            description: 'トークン検証が不完全です'
          }
        ],
        aiKeyRisks: [
          {
            riskId: 'AUTH-001',
            filePath: '/src/api/user.ts',
            riskLevel: RiskLevel.HIGH,
            title: '認証バイパスの可能性',
            problem: 'JWTトークンの署名検証が欠落',
            context: {
              codeSnippet: 'if (token) { return true; }',
              startLine: 15,
              endLine: 15
            },
            suggestedAction: {
              type: AIActionType.ADD_ASSERTION,
              description: 'JWT検証ロジックを追加',
              example: 'const payload = jwt.verify(token, secret);'
            }
          }
        ]
      };

      expect(result.schemaVersion).toBe('1.0');
      expect(result.summary).toBeDefined();
      expect(result.detailedIssues).toBeInstanceOf(Array);
      expect(result.aiKeyRisks).toBeInstanceOf(Array);
    });

    it('スキーマバージョンが必須であることを検証する', () => {
      const result: UnifiedAnalysisResult = {
        schemaVersion: '1.0',
        summary: {} as ExecutiveSummary,
        detailedIssues: [],
        aiKeyRisks: []
      };

      expect(result.schemaVersion).toBe('1.0');
    });
  });

  describe('統計情報の整合性', () => {
    it('リスクカウントの合計が妥当であることを検証する', () => {
      const summary: ExecutiveSummary = {
        overallScore: 70,
        overallGrade: 'C',
        dimensions: [],
        statistics: {
          totalFiles: 50,
          totalTests: 75,
          riskCounts: {
            CRITICAL: 2,
            HIGH: 5,
            MEDIUM: 10,
            LOW: 15,
            MINIMAL: 8
          }
        }
      };

      const totalRisks = Object.values(summary.statistics.riskCounts)
        .reduce((sum, count) => sum + count, 0);
      
      expect(totalRisks).toBe(40);
      expect(totalRisks).toBeLessThanOrEqual(summary.statistics.totalTests);
    });
  });

  describe('ディメンション重み付けの検証', () => {
    it('すべてのディメンション重みの合計が1.0になることを検証する', () => {
      const summary: ExecutiveSummary = {
        overallScore: 75,
        overallGrade: 'C',
        dimensions: [
          { name: 'テスト意図実現度', score: 80, weight: 0.3, impact: 24, breakdown: [] },
          { name: 'セキュリティリスク', score: 70, weight: 0.5, impact: 35, breakdown: [] },
          { name: 'コード品質', score: 85, weight: 0.2, impact: 17, breakdown: [] }
        ],
        statistics: {
          totalFiles: 0,
          totalTests: 0,
          riskCounts: { CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0, MINIMAL: 0 }
        }
      };

      const totalWeight = summary.dimensions
        .reduce((sum, dim) => sum + dim.weight, 0);
      
      expect(totalWeight).toBeCloseTo(1.0, 5);
    });
  });
});

describe('型の後方互換性', () => {
  it('既存のSeverity enumからRiskLevelへのマッピングが可能', () => {
    // 既存のSeverityタイプ（小文字）
    type OldSeverity = 'critical' | 'high' | 'medium' | 'low';
    
    // マッピング関数のテスト
    const mapSeverityToRiskLevel = (severity: OldSeverity): RiskLevel => {
      const mapping: Record<OldSeverity, RiskLevel> = {
        'critical': RiskLevel.CRITICAL,
        'high': RiskLevel.HIGH,
        'medium': RiskLevel.MEDIUM,
        'low': RiskLevel.LOW
      };
      return mapping[severity];
    };

    expect(mapSeverityToRiskLevel('critical')).toBe(RiskLevel.CRITICAL);
    expect(mapSeverityToRiskLevel('high')).toBe(RiskLevel.HIGH);
    expect(mapSeverityToRiskLevel('medium')).toBe(RiskLevel.MEDIUM);
    expect(mapSeverityToRiskLevel('low')).toBe(RiskLevel.LOW);
  });
});