import { 
  ITestQualityPlugin, 
  IPlugin, 
  Issue, 
  ProjectContext, 
  TestFile, 
  DetectionResult, 
  QualityScore, 
  Improvement 
} from '../../core/types';

export class LegacyPluginAdapter implements ITestQualityPlugin {
  public readonly id: string;
  public readonly name: string;
  public readonly version = '1.0.0';
  public readonly type = 'core' as const;

  constructor(private legacyPlugin: IPlugin) {
    this.id = `legacy-adapter-${legacyPlugin.name}`;
    this.name = `Legacy Adapter: ${legacyPlugin.name}`;
  }

  isApplicable(_context: ProjectContext): boolean {
    // レガシープラグインは常に適用可能とする
    return true;
  }

  async detectPatterns(testFile: TestFile): Promise<DetectionResult[]> {
    try {
      const issues = await this.legacyPlugin.analyze(testFile.path);
      return issues.map((issue, index) => this.convertIssueToPattern(issue, testFile, index));
    } catch (error) {
      // レガシープラグインでエラーが発生した場合は空配列を返す
      console.warn(`Legacy plugin ${this.legacyPlugin.name} failed:`, error);
      return [];
    }
  }

  evaluateQuality(patterns: DetectionResult[]): QualityScore {
    const issueCount = patterns.length;
    
    // 問題1つにつき20点減点（レガシープラグインは単純な計算）
    const overall = Math.max(0, 100 - (issueCount * 20));
    
    // 信頼度は検出されたパターンの平均信頼度
    const avgConfidence = patterns.length > 0 
      ? patterns.reduce((sum, p) => sum + p.confidence, 0) / patterns.length
      : 1.0;

    return {
      overall,
      breakdown: {
        completeness: 50,
        correctness: overall,
        maintainability: 60
      },
      confidence: avgConfidence
    };
  }

  suggestImprovements(evaluation: QualityScore): Improvement[] {
    const improvements: Improvement[] = [];
    
    const correctnessScore = evaluation.breakdown.correctness || 0;
    
    // レガシープラグインベースの基本的な改善提案
    if (correctnessScore < 70) {
      improvements.push({
        id: 'legacy-improvement',
        priority: 'medium',
        type: 'add',
        title: 'Legacy plugin compatibility issues',
        description: 'レガシープラグインで検出された問題を解決してください',
        location: {
          file: 'unknown',
          line: 1,
          column: 1
        },
        estimatedImpact: {    
          scoreImprovement: 20,
          effortMinutes: 30
        },
        automatable: false
      });
    }

    return improvements;
  }

  private convertIssueToPattern(issue: Issue, testFile: TestFile, index: number): DetectionResult {
    return {
      patternId: `legacy-issue-${issue.type}`,
      patternName: `Legacy Issue: ${issue.type}`,
      location: {
        file: issue.file || testFile.path,
        line: issue.line || 1,
        column: 1
      },
      confidence: this.calculateConfidenceFromSeverity(issue.severity),
      evidence: [
        {
          type: 'code',
          description: `Legacy plugin (${this.legacyPlugin.name}): ${issue.message}`,
          location: {
            file: issue.file || testFile.path,
            line: issue.line || 1,
            column: 1
          },
          code: 'N/A',
          confidence: this.calculateConfidenceFromSeverity(issue.severity)
        }
      ],
      metadata: {
        legacyPlugin: this.legacyPlugin.name,
        originalIssue: issue,
        adapterIndex: index
      }
    };
  }

  private calculateConfidenceFromSeverity(severity: 'error' | 'warning'): number {
    // エラーは高い信頼度、警告は中程度の信頼度
    switch (severity) {
      case 'error':
        return 0.7;
      case 'warning':
        return 0.5;
      default:
        return 0.5;
    }
  }
}