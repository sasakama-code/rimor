/**
 * TaintAnalysisPlugin
 * 
 * 汚染解析に特化したセキュリティプラグイン
 * BaseSecurityPluginを継承し、データフロー解析を実行
 */

import { BaseSecurityPlugin } from '../base/BaseSecurityPlugin';
import { 
  ProjectContext, 
  TestFile, 
  DetectionResult, 
  QualityScore, 
  Improvement 
} from '../../core/types';
import { PathSecurity } from '../../utils/pathSecurity';

export class TaintAnalysisPlugin extends BaseSecurityPlugin {
  id = 'taint-analysis';
  name = 'Taint Analysis Security Plugin';
  version = '1.0.0';

  isApplicable(context: ProjectContext): boolean {
    // セキュリティテストが必要なプロジェクトで適用
    return true;
  }

  async detectPatterns(testFile: TestFile): Promise<DetectionResult[]> {
    const results: DetectionResult[] = [];

    if (!testFile.content) {
      return results;
    }

    // 汚染源から危険なシンクへのデータフローを検出
    const taintFlows = this.analyzeTaintFlow(testFile.content);
    
    taintFlows.forEach(flow => {
      results.push({
        patternId: `taint-flow-${flow.type}`,
        patternName: `Taint Flow: ${flow.type}`,
        severity: flow.severity,
        confidence: 0.8,
        location: {
          file: testFile.path,
          line: flow.line,
          column: flow.column
        },
        metadata: {
          description: `Tainted data flow detected: ${flow.source} → ${flow.sink}`,
          category: 'security'
        }
      });
    });

    // BaseSecurityPluginの汎用パターン検出も利用
    const securityPatterns = this.detectSecurityPatterns(testFile.content);
    securityPatterns.forEach(pattern => {
      if (this.isTaintRelated(pattern.type)) {
        results.push({
          patternId: pattern.type,
          patternName: pattern.type,
          severity: pattern.severity,
          confidence: 0.85,
          location: {
            file: testFile.path,
            line: pattern.line || 1,
            column: pattern.column || 1
          },
          metadata: {
            description: pattern.description,
            category: 'security'
          }
        });
      }
    });

    return results;
  }

  evaluateQuality(patterns: DetectionResult[]): QualityScore {
    const securityScore = this.evaluateSecurityScore(patterns);
    
    // 汚染解析特有の評価ロジック
    let dataFlowScore = 1;
    patterns.forEach(pattern => {
      if (pattern.patternId && pattern.patternId.startsWith('taint-flow-')) {
        dataFlowScore *= pattern.severity === 'critical' ? 0.2 : 0.5;
      }
    });

    const overall = ((securityScore + dataFlowScore) / 2) * 100;

    return {
      overall,
      dimensions: {
        completeness: overall,
        correctness: overall,
        maintainability: 80
      },
      confidence: patterns.length > 0 ? 
        patterns.reduce((sum, p) => sum + p.confidence, 0) / patterns.length : 1
    };
  }

  suggestImprovements(evaluation: QualityScore): Improvement[] {
    const improvements: Improvement[] = [];

    if (evaluation.overall < 30) {
      improvements.push({
        id: 'fix-critical-taint-flows',
        priority: 'critical',
        type: 'security',
        category: 'security',
        title: 'Fix critical security vulnerabilities',
        description: 'Sanitize tainted data flows and fix SQL injection vulnerabilities',
        location: {
          file: '',
          line: 1,
          column: 1
        },
        estimatedImpact: 0.6,
        autoFixable: false
      });
    } else if (evaluation.overall < 70) {
      improvements.push({
        id: 'improve-input-validation',
        priority: 'high',
        type: 'security',
        category: 'security',
        title: 'Improve input validation',
        description: 'Add input validation and sanitization for user inputs',
        location: {
          file: '',
          line: 1,
          column: 1
        },
        estimatedImpact: 0.3,
        autoFixable: false
      });
    }

    return improvements;
  }

  /**
   * 汚染フロー解析
   */
  private analyzeTaintFlow(content: string): Array<{
    type: string;
    source: string;
    sink: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    line: number;
    column: number;
  }> {
    const flows: Array<{
      type: string;
      source: string;
      sink: string;
      severity: 'low' | 'medium' | 'high' | 'critical';
      line: number;
      column: number;
    }> = [];
    const lines = content.split('\n');

    // 簡易的な汚染フロー検出
    // 実際の実装では、より高度なデータフロー解析が必要
    const taintSources = [
      'request.params',
      'request.body',
      'request.query',
      'process.argv',
      'localStorage.getItem'
    ];

    const dangerousSinks = [
      { pattern: 'db.query', type: 'sql', severity: 'critical' as const },
      { pattern: 'exec', type: 'command', severity: 'critical' as const },
      { pattern: 'innerHTML', type: 'xss', severity: 'high' as const },
      { pattern: 'eval', type: 'eval', severity: 'critical' as const },
      { pattern: 'fs.readFile', type: 'path', severity: 'high' as const }
    ];

    lines.forEach((line, index) => {
      // 変数への汚染源の代入を検出
      const assignmentMatch = line.match(/const\s+(\w+)\s*=\s*(.+)/);
      if (assignmentMatch) {
        const varName = assignmentMatch[1];
        const value = assignmentMatch[2];
        
        // 汚染源からの代入かチェック
        const taintSource = taintSources.find(source => value.includes(source));
        if (taintSource) {
          // 同じ変数が危険なシンクで使用されているかチェック
          for (let j = index + 1; j < lines.length; j++) {
            const laterLine = lines[j];
            
            for (const sink of dangerousSinks) {
              if (laterLine.includes(sink.pattern) && laterLine.includes(varName)) {
                flows.push({
                  type: sink.type,
                  source: taintSource,
                  sink: sink.pattern,
                  severity: sink.severity,
                  line: j + 1,
                  column: 1
                });
              }
            }
          }
        }
      }
    });

    return flows;
  }

  /**
   * 汚染解析に関連するパターンかチェック
   */
  private isTaintRelated(patternType: string): boolean {
    const taintRelatedPatterns = [
      'sql-injection',
      'command-injection',
      'xss',
      'path-traversal'
    ];
    
    return taintRelatedPatterns.includes(patternType);
  }
}