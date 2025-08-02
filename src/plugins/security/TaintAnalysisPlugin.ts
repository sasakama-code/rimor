/**
 * 汚染解析プラグイン
 * arXiv:2504.18529v2の技術をRimorのプラグインシステムに統合
 */

import { BasePlugin } from '../base/BasePlugin';
import { 
  ITestQualityPlugin, 
  DetectionResult, 
  QualityScore, 
  Improvement,
  TestFile,
  ProjectContext
} from '../../core/types';
import { TaintAnalysisSystem, TaintAnalysisResult } from '../../security/taint-analysis-system';

/**
 * 汚染解析プラグイン
 */
export class TaintAnalysisPlugin extends BasePlugin implements ITestQualityPlugin {
  id = 'taint-analysis';
  name = '型ベース汚染解析プラグイン';
  version = '1.0.0';
  type: 'pattern' = 'pattern';
  
  private taintSystem: TaintAnalysisSystem;
  
  constructor() {
    super();
    this.taintSystem = new TaintAnalysisSystem({
      inference: {
        enableSearchBased: true,
        enableLocalOptimization: true,
        enableIncremental: false,
        maxSearchDepth: 50,
        confidenceThreshold: 0.8
      },
      library: {
        loadBuiltins: true,
        customLibraryPaths: [],
        unknownMethodBehavior: 'conservative'
      },
      compatibility: {
        exportJAIF: false,
        generateStubs: false,
        gradualMigration: false
      }
    });
  }
  
  /**
   * このプラグインが適用可能かチェック
   */
  isApplicable(context: ProjectContext): boolean {
    // TypeScript/JavaScriptプロジェクトで適用可能
    return context.language === 'typescript' || context.language === 'javascript';
  }
  
  /**
   * テストファイルから汚染パターンを検出
   */
  async detectPatterns(testFile: TestFile): Promise<DetectionResult[]> {
    const results: DetectionResult[] = [];
    
    try {
      // テストファイルの汚染解析
      const analysisResult = await this.taintSystem.analyzeCode(
        testFile.content,
        { fileName: testFile.path }
      );
      
      // 検出された問題をDetectionResultに変換
      for (const issue of analysisResult.issues) {
        results.push({
          patternId: `taint-${issue.type}`,
          patternName: issue.message,
          location: {
            file: testFile.path,
            line: issue.location.line,
            column: issue.location.column
          },
          severity: this.mapSeverity(issue.severity),
          confidence: 0.9,
          metadata: {
            type: issue.type,
            suggestion: issue.suggestion,
            message: issue.message
          }
        });
      }
      
      // セキュリティ関連のテスト不足を検出
      const securityPatterns = this.detectSecurityTestPatterns(testFile.content, testFile.path);
      results.push(...securityPatterns);
      
    } catch (error) {
      results.push({
        patternId: 'taint-analysis-error',
        patternName: `Taint analysis failed: ${error}`,
        location: { file: testFile.path, line: 0, column: 0 },
        severity: 'medium',
        confidence: 1.0
      });
    }
    
    return results;
  }
  
  /**
   * 品質評価
   */
  evaluateQuality(patterns: DetectionResult[]): QualityScore {
    const issues = patterns.filter(p => p.patternId && p.patternId.startsWith('taint-'));
    const securityTests = patterns.filter(p => p.patternId === 'security-test-coverage');
    
    // スコア計算
    let score = 100;
    
    // 汚染フローの問題は大きく減点
    const taintFlowIssues = issues.filter(i => i.metadata?.type === 'taint-flow');
    score -= taintFlowIssues.length * 15;
    
    // 型の不一致も減点
    const typeIssues = issues.filter(i => i.metadata?.type === 'incompatible-types');
    score -= typeIssues.length * 10;
    
    // セキュリティテストの不足
    const missingTests = securityTests.filter(t => t.severity === 'medium');
    score -= missingTests.length * 5;
    
    // スコアを0-100の範囲に制限
    score = Math.max(0, Math.min(100, score));
    
    return {
      overall: score,
      security: score,
      details: {
        category: this.getCategory(score),
        taintFlowIssues: taintFlowIssues.length,
        typeCompatibilityIssues: typeIssues.length,
        securityTestCoverage: securityTests.length > 0 ? 
          (securityTests.length - missingTests.length) / securityTests.length : 0
      }
    };
  }
  
  /**
   * 改善提案
   */
  suggestImprovements(evaluation: QualityScore): Improvement[] {
    const improvements: Improvement[] = [];
    const details = evaluation.details as any;
    
    if (details.taintFlowIssues > 0) {
      improvements.push({
        id: 'fix-taint-flows',
        type: 'modify',
        title: '汚染フローの修正',
        description: '検出された汚染フローを修正し、適切なサニタイズ処理を追加してください',
        priority: 'high',
        location: { file: '', line: 0, column: 0 },
        estimatedImpact: {
          scoreImprovement: 15 * details.taintFlowIssues,
          effortMinutes: 30 * details.taintFlowIssues
        },
        automatable: false,
        codeExample: `// Before:
const userInput = req.body.data;
db.query(userInput); // 汚染されたデータの直接使用

// After:
const userInput = req.body.data;
const sanitized = sanitize(userInput);
db.query(sanitized); // サニタイズ後の使用`
      });
    }
    
    if (details.typeCompatibilityIssues > 0) {
      improvements.push({
        id: 'fix-type-annotations',
        type: 'modify',
        title: '型アノテーションの修正',
        description: '@Tainted/@Untaintedアノテーションを適切に使用してください',
        priority: 'medium',
        location: { file: '', line: 0, column: 0 },
        estimatedImpact: {
          scoreImprovement: 10 * details.typeCompatibilityIssues,
          effortMinutes: 20 * details.typeCompatibilityIssues
        },
        automatable: false,
        codeExample: `// Before:
function process(input: string) { // アノテーションなし

// After:
import { Tainted } from '@rimor/security';

function process(@Tainted input: string) { // 明示的なアノテーション`
      });
    }
    
    if (details.securityTestCoverage < 0.8) {
      improvements.push({
        id: 'improve-security-tests',
        type: 'add',
        category: 'test-coverage',
        title: 'セキュリティテストの追加',
        description: 'セキュリティ関連のテストケースを追加してください',
        priority: 'medium',
        location: { file: '', line: 0, column: 0 },
        estimatedImpact: {
          scoreImprovement: 20,
          effortMinutes: 60
        },
        automatable: false,
        codeExample: `// Before:
// セキュリティテストなし

// After:
describe('Security', () => {
  it('should sanitize user input', () => {
    const maliciousInput = '<script>alert("XSS")</script>';
    const result = sanitizeInput(maliciousInput);
    expect(result).not.toContain('<script>');
  });
  
  it('should prevent SQL injection', () => {
    const sqlInjection = "'; DROP TABLE users; --";
    const query = buildQuery(sqlInjection);
    expect(query).toBe('SELECT * FROM users WHERE id = ?');
  });
});`
      });
    }
    
    return improvements;
  }
  
  /**
   * セキュリティテストパターンの検出
   */
  private detectSecurityTestPatterns(content: string, filePath: string): DetectionResult[] {
    const results: DetectionResult[] = [];
    const lines = content.split('\n');
    
    // セキュリティ関連のテストキーワード
    const securityKeywords = [
      'sanitize', 'escape', 'validate', 'xss', 'injection',
      'csrf', 'authentication', 'authorization', 'crypto'
    ];
    
    // テスト関数の検出
    const testPattern = /(?:it|test|describe)\s*\(\s*['"`]([^'"`]+)['"`]/g;
    let hasSecurityTests = false;
    
    let match;
    while ((match = testPattern.exec(content)) !== null) {
      const testName = match[1].toLowerCase();
      if (securityKeywords.some(keyword => testName.includes(keyword))) {
        hasSecurityTests = true;
        break;
      }
    }
    
    // セキュリティ関連の関数呼び出しをチェック
    const hasSecurityFunctions = content.match(/\b(sanitize|validate|escape|encrypt|hash)[A-Za-z]*\s*\(/);
    
    if (!hasSecurityTests && hasSecurityFunctions) {
      results.push({
        patternId: 'security-test-coverage',
        patternName: 'セキュリティ関連の関数が使用されていますが、対応するテストがありません',
        location: { file: filePath, line: 0, column: 0 },
        severity: 'medium',
        confidence: 0.7
      });
    }
    
    return results;
  }
  
  /**
   * 重要度のマッピング
   */
  private mapSeverity(severity: 'error' | 'warning' | 'info'): 'high' | 'medium' | 'low' {
    switch (severity) {
      case 'error': return 'high';
      case 'warning': return 'medium';
      case 'info': return 'low';
      default: return 'low';
    }
  }
  
  /**
   * スコアからカテゴリを判定
   */
  private getCategory(score: number): string {
    if (score >= 90) return 'Excellent';
    if (score >= 70) return 'Good';
    if (score >= 50) return 'Fair';
    return 'Poor';
  }
}