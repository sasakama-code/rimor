/**
 * CIトレーサビリティ機能
 * GitHub Actions環境変数から実行コンテキストを収集
 */

export interface CITraceability {
  // GitHub Actions情報
  runId: string;           // GITHUB_RUN_ID
  runNumber: string;       // GITHUB_RUN_NUMBER
  workflow: string;        // GITHUB_WORKFLOW
  job: string;            // GITHUB_JOB
  actor: string;          // GITHUB_ACTOR
  
  // リポジトリ情報
  repository: string;      // GITHUB_REPOSITORY
  branch: string;         // GITHUB_REF_NAME
  sha: string;           // GITHUB_SHA
  prNumber?: string;      // PR番号（該当する場合）
  
  // 実行環境
  nodeVersion: string;    // マトリックス情報から取得
  os: string;            // ランナーOS (RUNNER_OS)
  timestamp: string;      // 実行日時
  
  // エラー照合用
  errorHash: string;      // エラーの一意識別子
}

export class CITraceabilityCollector {
  /**
   * GitHub Actions環境変数からトレーサビリティ情報を収集
   */
  static collect(): CITraceability | null {
    // CI環境でない場合はnullを返す
    if (process.env.CI !== 'true') {
      return null;
    }
    
    const prNumber = this.extractPRNumber();
    
    return {
      runId: process.env.GITHUB_RUN_ID || 'unknown',
      runNumber: process.env.GITHUB_RUN_NUMBER || 'unknown',
      workflow: process.env.GITHUB_WORKFLOW || 'unknown',
      job: process.env.GITHUB_JOB || 'unknown',
      actor: process.env.GITHUB_ACTOR || 'unknown',
      repository: process.env.GITHUB_REPOSITORY || 'unknown',
      branch: process.env.GITHUB_REF_NAME || 'unknown',
      sha: process.env.GITHUB_SHA || 'unknown',
      prNumber,
      nodeVersion: process.version,
      os: process.env.RUNNER_OS || process.platform,
      timestamp: new Date().toISOString(),
      errorHash: '' // エラー収集時に設定
    };
  }
  
  /**
   * PR番号を抽出
   */
  private static extractPRNumber(): string | undefined {
    // GITHUB_REF形式: refs/pull/123/merge
    const ref = process.env.GITHUB_REF;
    if (ref && ref.includes('pull/')) {
      const match = ref.match(/pull\/(\d+)\//);
      if (match) {
        return match[1];
      }
    }
    
    // GitHub Actions のPRイベント
    if (process.env.GITHUB_EVENT_NAME === 'pull_request') {
      // PR番号は通常、イベントペイロードから取得するが、
      // ここでは簡易的にREFから取得
      return undefined;
    }
    
    return undefined;
  }
  
  /**
   * エラーハッシュを生成
   */
  static generateErrorHash(error: {
    testFile: string;
    testName: string;
    errorMessage: string;
  }): string {
    const crypto = require('crypto');
    const data = `${error.testFile}:${error.testName}:${error.errorMessage}`;
    return crypto.createHash('md5').update(data).digest('hex').substring(0, 8);
  }
  
  /**
   * CI実行へのディープリンクを生成
   */
  static generateDeepLink(traceability: CITraceability): string {
    const { repository, runId } = traceability;
    return `https://github.com/${repository}/actions/runs/${runId}`;
  }
  
  /**
   * PRへのリンクを生成
   */
  static generatePRLink(traceability: CITraceability): string | undefined {
    if (!traceability.prNumber) {
      return undefined;
    }
    const { repository, prNumber } = traceability;
    return `https://github.com/${repository}/pull/${prNumber}`;
  }
}