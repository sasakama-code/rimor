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
        legacy: {
          score: overall,
          weight: 1.0,
          issues: patterns.map(p => p.patternId.replace('legacy-issue-', ''))
        }
      },
      confidence: avgConfidence,
      explanation: `Legacy plugin compatibility mode: ${issueCount} issues detected, scored ${overall}/100`
    };
  }

  suggestImprovements(evaluation: QualityScore): Improvement[] {
    const improvements: Improvement[] = [];
    
    if (evaluation.breakdown.legacy) {
      evaluation.breakdown.legacy.issues.forEach((issue, index) => {
        improvements.push({
          id: `legacy-improvement-${index}`,
          priority: 'medium',
          type: 'add',
          title: `Legacy plugin issue: ${issue}`,
          description: `レガシープラグインで検出された問題を解決してください: ${issue}`,
          location: {
            file: 'unknown', // レガシープラグインでは詳細な位置情報が不明
            startLine: 1,
            endLine: 1
          },
          estimatedImpact: {
            scoreImprovement: 20, // 1問題あたり20点改善
            effortMinutes: 30 // デフォルト見積もり
          },
          automatable: false // レガシープラグインの問題は基本的に手動修正
        });
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
        startLine: issue.line || 1,
        endLine: issue.line || 1
      },
      confidence: this.calculateConfidenceFromSeverity(issue.severity),
      evidence: [
        {
          type: 'code',
          description: `Legacy plugin (${this.legacyPlugin.name}): ${issue.message}`,
          line: issue.line
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