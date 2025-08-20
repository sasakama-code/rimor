/**
 * Security Auditor Implementation
 * v0.8.0 - 基本的なセキュリティ監査実装
 */

import { injectable } from 'inversify';
import {
  ISecurityAuditor,
  SecurityAuditResult,
  SecurityAuditOptions,
  SecurityThreat,
  ThreatType
} from '../interfaces/ISecurityAuditor';
import * as fs from 'fs';
import * as path from 'path';
import { glob } from 'glob';
import { TypeBasedSecurityEngine } from '../../security/analysis/engine';
import { ModularTestAnalyzer } from '../../security/analysis/modular';
import { FlowSensitiveAnalyzer } from '../../security/analysis/flow';
import { TestCase } from '../../security/types';
import { TestMethod } from '../types';

@injectable()
export class SecurityAuditor implements ISecurityAuditor {
  private typeBasedEngine: TypeBasedSecurityEngine;
  private modularAnalyzer: ModularTestAnalyzer;
  private flowAnalyzer: FlowSensitiveAnalyzer;
  
  constructor() {
    // v0.7.0セキュリティエンジンの初期化
    this.typeBasedEngine = new TypeBasedSecurityEngine({
      strictness: 'moderate',
      enableCache: true
    });
    this.modularAnalyzer = new ModularTestAnalyzer();
    this.flowAnalyzer = new FlowSensitiveAnalyzer();
  }
  
  // 基本的なセキュリティパターン
  private readonly patterns = {
    [ThreatType.HARDCODED_SECRET]: [
      /api[_-]?key\s*[:=]\s*['"][^'"]{10,}/gi,
      /secret[_-]?key\s*[:=]\s*['"][^'"]{10,}/gi,
      /password\s*[:=]\s*['"][^'"]{8,}/gi,
      /token\s*[:=]\s*['"][^'"]{10,}/gi
    ],
    [ThreatType.INJECTION]: [
      /exec\s*\([^)]*\+[^)]*\)/g,
      /eval\s*\([^)]*\+[^)]*\)/g,
      /innerHTML\s*=\s*[^'"`]/g
    ],
    [ThreatType.PATH_TRAVERSAL]: [
      /\.\.\/|\.\.\\/g,
      /path\.join\s*\([^)]*\.\./g
    ],
    [ThreatType.UNVALIDATED_INPUT]: [
      /req\.(body|query|params)\.[a-zA-Z_]+(?!\s*\|\|\s*['"])/g,
      /process\.argv\[[0-9]+\](?!\s*\|\|\s*['"])/g
    ]
  };

  async audit(targetPath: string, options?: SecurityAuditOptions): Promise<SecurityAuditResult> {
    const startTime = Date.now();
    const threats: SecurityThreat[] = [];
    let filesScanned = 0;

    try {
      const files = await this.findSourceFiles(targetPath, options);
      
      // テストファイルとソースファイルを分離
      const testFiles: string[] = [];
      const sourceFiles: string[] = [];
      
      for (const file of files) {
        if (file.includes('.test.') || file.includes('.spec.')) {
          testFiles.push(file);
        } else {
          sourceFiles.push(file);
        }
      }
      
      // v0.7.0型ベースセキュリティ解析を全ファイルに適用
      const allFiles = [...testFiles, ...sourceFiles];
      if (allFiles.length > 0) {
        const testCases: TestCase[] = await Promise.all(
          allFiles.map(async file => ({
            name: path.basename(file),
            file,
            content: await fs.promises.readFile(file, 'utf-8'),
            metadata: {
              framework: 'unknown',
              language: file.endsWith('.ts') ? 'typescript' : 'javascript',
              lastModified: new Date()
            }
          }))
        );
        
        const compileTimeResult = await this.typeBasedEngine.analyzeAtCompileTime(testCases);
        
        // 型ベース解析の結果をSecurityThreatに変換
        for (const issue of compileTimeResult.issues) {
          threats.push({
            type: this.mapSecurityIssueToThreatType(issue.type),
            severity: issue.severity as 'critical' | 'high' | 'medium' | 'low',
            file: issue.location.file,
            line: issue.location.line,
            column: issue.location.column,
            message: issue.message,
            recommendation: issue.fixSuggestion || '適切なセキュリティ対策を実装してください'
          });
        }
      }
      
      // 従来のパターンベース解析をソースファイルに適用
      for (const file of sourceFiles) {
        filesScanned++;
        const fileThreats = await this.scanFile(file);
        threats.push(...fileThreats);
      }
      
      filesScanned += testFiles.length;
      
      const summary = this.summarizeThreats(threats);
      
      return {
        threats,
        summary,
        executionTime: Date.now() - startTime,
        filesScanned
      };
    } catch (error) {
      throw new Error(`Security audit failed: ${error}`);
    }
  }

  async scanFile(filePath: string): Promise<SecurityThreat[]> {
    const threats: SecurityThreat[] = [];
    
    try {
      const content = await fs.promises.readFile(filePath, 'utf-8');
      const lines = content.split('\n');
      
      // 各セキュリティパターンをチェック
      for (const [threatType, patterns] of Object.entries(this.patterns)) {
        for (const pattern of patterns) {
          // patternは既にRegExpオブジェクトなので、そのまま使用
          lines.forEach((line, index) => {
            const match = pattern.exec(line);
            if (match) {
              threats.push(this.createThreat(
                threatType as ThreatType,
                filePath,
                index + 1,
                match.index,
                line.trim()
              ));
              // グローバルフラグをリセット
              pattern.lastIndex = 0;
            }
          });
        }
      }
    } catch (error) {
      // ファイル読み取りエラーは無視
    }
    
    return threats;
  }

  private async findSourceFiles(targetPath: string, options?: SecurityAuditOptions): Promise<string[]> {
    const patterns = ['**/*.{js,ts,jsx,tsx}'];
    const ignore = ['node_modules/**', 'dist/**', 'coverage/**'];
    
    if (!options?.includeTests) {
      ignore.push('**/*.test.*', '**/*.spec.*', '__tests__/**');
    }
    
    const files = await glob(patterns, {
      cwd: targetPath,
      absolute: true,
      ignore
    });
    
    return files;
  }

  private createThreat(
    type: ThreatType,
    file: string,
    line: number,
    column: number,
    code: string
  ): SecurityThreat {
    const severityMap: Record<ThreatType, 'critical' | 'high' | 'medium' | 'low'> = {
      [ThreatType.INJECTION]: 'critical',
      [ThreatType.XSS]: 'high',
      [ThreatType.CSRF]: 'high',
      [ThreatType.AUTH_BYPASS]: 'critical',
      [ThreatType.DATA_EXPOSURE]: 'high',
      [ThreatType.INSECURE_CRYPTO]: 'high',
      [ThreatType.HARDCODED_SECRET]: 'high',
      [ThreatType.PATH_TRAVERSAL]: 'high',
      [ThreatType.UNVALIDATED_INPUT]: 'medium'
    };

    const recommendationMap: Record<ThreatType, string> = {
      [ThreatType.INJECTION]: 'サニタイズされた入力を使用するか、パラメータ化されたクエリを使用してください',
      [ThreatType.XSS]: 'HTMLエスケープ処理を実装し、Content Security Policyを設定してください',
      [ThreatType.CSRF]: 'CSRFトークンを実装し、SameSite Cookieを使用してください',
      [ThreatType.AUTH_BYPASS]: '適切な認証・認可メカニズムを実装してください',
      [ThreatType.DATA_EXPOSURE]: '機密データの暗号化と適切なアクセス制御を実装してください',
      [ThreatType.INSECURE_CRYPTO]: '業界標準の暗号化アルゴリズムを使用してください',
      [ThreatType.HARDCODED_SECRET]: '環境変数または安全な設定管理システムを使用してください',
      [ThreatType.PATH_TRAVERSAL]: 'パス入力を検証し、正規化してください',
      [ThreatType.UNVALIDATED_INPUT]: '入力検証とサニタイゼーションを実装してください'
    };

    return {
      type,
      severity: severityMap[type] || 'medium',
      file,
      line,
      column,
      message: `潜在的な${type}の脆弱性が検出されました`,
      recommendation: recommendationMap[type] || '適切なセキュリティ対策を実装してください'
    };
  }

  private summarizeThreats(threats: SecurityThreat[]): SecurityAuditResult['summary'] {
    const summary = {
      critical: 0,
      high: 0,
      medium: 0,
      low: 0,
      total: threats.length
    };

    threats.forEach(threat => {
      summary[threat.severity]++;
    });

    return summary;
  }
  
  /**
   * セキュリティイシュータイプを脅威タイプにマッピング
   */
  private mapSecurityIssueToThreatType(issueType: string): ThreatType {
    const typeMap: Record<string, ThreatType> = {
      'missing-sanitizer': ThreatType.UNVALIDATED_INPUT,
      'unsafe-taint-flow': ThreatType.INJECTION,
      'missing-auth-test': ThreatType.AUTH_BYPASS,
      'insufficient-validation': ThreatType.UNVALIDATED_INPUT,
      'insecure-crypto': ThreatType.INSECURE_CRYPTO,
      'hardcoded-credentials': ThreatType.HARDCODED_SECRET,
      'data-exposure': ThreatType.DATA_EXPOSURE,
      'xss-vulnerability': ThreatType.XSS,
      'csrf-vulnerability': ThreatType.CSRF
    };
    
    return typeMap[issueType] || ThreatType.UNVALIDATED_INPUT;
  }
}