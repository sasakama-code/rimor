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

@injectable()
export class SecurityAuditorImpl implements ISecurityAuditor {
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
      
      for (const file of files) {
        filesScanned++;
        const fileThreats = await this.scanFile(file);
        threats.push(...fileThreats);
      }
      
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
          const regex = new RegExp(pattern);
          lines.forEach((line, index) => {
            const match = regex.exec(line);
            if (match) {
              threats.push(this.createThreat(
                threatType as ThreatType,
                filePath,
                index + 1,
                match.index,
                line.trim()
              ));
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
}