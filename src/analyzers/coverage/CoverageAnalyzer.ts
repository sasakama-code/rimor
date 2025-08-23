import * as fs from 'fs/promises';
import * as path from 'path';

export interface CoverageMetrics {
  total: number;
  covered: number;
  pct: number;
}

export interface CoverageSummary {
  lines: CoverageMetrics;
  statements: CoverageMetrics;
  functions: CoverageMetrics;
  branches: CoverageMetrics;
}

export interface CoverageFileDetails {
  path: string;
  statementMap: Record<string, unknown>;
  fnMap: Record<string, unknown>;
  branchMap: Record<string, unknown>;
  s: Record<string, number>;
  f: Record<string, number>;
  b: Record<string, number[]>;
}

export interface LowCoverageFile {
  filePath: string;
  linesPct: number;
  statementsPct: number;
  functionsPct: number;
  branchesPct: number;
}

export interface CoverageThresholds {
  lines: number;
  statements: number;
  functions: number;
  branches: number;
}

/**
 * CoverageAnalyzer
 * 
 * Jestが生成するカバレッジデータを解析し、テスト品質評価に必要な
 * カバレッジ情報を提供するクラス
 * 
 * 責任:
 * - カバレッジファイルの読み込み
 * - ファイル別・プロジェクト全体のカバレッジ計算
 * - 低カバレッジファイルの検出
 * - カバレッジ基準の評価
 */
export class CoverageAnalyzer {
  private readonly defaultThresholds: CoverageThresholds = {
    lines: 80,
    statements: 80,
    functions: 80,
    branches: 70
  };

  /**
   * カバレッジサマリーファイルを読み込む
   */
  async loadCoverageSummary(coverageDir: string): Promise<any | null> {
    try {
      const summaryPath = path.join(coverageDir, 'coverage-summary.json');
      const content = await fs.readFile(summaryPath, 'utf-8');
      return JSON.parse(content);
    } catch (error) {
      return null;
    }
  }

  /**
   * 詳細カバレッジファイルを読み込む
   */
  async loadCoverageFinal(coverageDir: string): Promise<Record<string, CoverageFileDetails> | null> {
    try {
      const finalPath = path.join(coverageDir, 'coverage-final.json');
      const content = await fs.readFile(finalPath, 'utf-8');
      return JSON.parse(content);
    } catch (error) {
      return null;
    }
  }

  /**
   * 特定ファイルのカバレッジ情報を取得
   */
  async getFileCoverage(coverageDir: string, filePath: string): Promise<CoverageSummary | null> {
    const coverageData = await this.loadCoverageFinal(coverageDir);
    if (!coverageData || !coverageData[filePath]) {
      return null;
    }

    const fileData = coverageData[filePath];
    return this.calculateFileCoverage(fileData);
  }

  /**
   * プロジェクト全体のカバレッジ情報を取得
   */
  async getOverallCoverage(coverageDir: string): Promise<CoverageSummary | null> {
    const summaryData = await this.loadCoverageSummary(coverageDir);
    if (!summaryData || !summaryData.total) {
      return null;
    }

    return {
      lines: {
        total: summaryData.total.lines.total,
        covered: summaryData.total.lines.covered,
        pct: summaryData.total.lines.pct
      },
      statements: {
        total: summaryData.total.statements.total,
        covered: summaryData.total.statements.covered,
        pct: summaryData.total.statements.pct
      },
      functions: {
        total: summaryData.total.functions.total,
        covered: summaryData.total.functions.covered,
        pct: summaryData.total.functions.pct
      },
      branches: {
        total: summaryData.total.branches.total,
        covered: summaryData.total.branches.covered,
        pct: summaryData.total.branches.pct
      }
    };
  }

  /**
   * 低カバレッジファイルを検出
   */
  async findLowCoverageFiles(coverageDir: string, threshold: number = 5): Promise<LowCoverageFile[]> {
    const coverageData = await this.loadCoverageFinal(coverageDir);
    if (!coverageData) {
      return [];
    }

    const lowCoverageFiles: LowCoverageFile[] = [];

    for (const [filePath, fileData] of Object.entries(coverageData)) {
      const coverage = this.calculateFileCoverage(fileData);
      
      if (coverage.lines.pct <= threshold) {
        lowCoverageFiles.push({
          filePath,
          linesPct: coverage.lines.pct,
          statementsPct: coverage.statements.pct,
          functionsPct: coverage.functions.pct,
          branchesPct: coverage.branches.pct
        });
      }
    }

    return lowCoverageFiles.sort((a, b) => a.linesPct - b.linesPct);
  }

  /**
   * カバレッジが基準を満たしているかチェック
   */
  isCoverageAdequate(coverage: CoverageSummary, thresholds?: CoverageThresholds): boolean {
    const limits = thresholds || this.defaultThresholds;
    
    return coverage.lines.pct >= limits.lines &&
           coverage.statements.pct >= limits.statements &&
           coverage.functions.pct >= limits.functions &&
           coverage.branches.pct >= limits.branches;
  }

  /**
   * カバレッジ閾値を取得
   */
  getCoverageThresholds(): CoverageThresholds {
    return { ...this.defaultThresholds };
  }

  /**
   * ファイルデータからカバレッジを計算
   */
  private calculateFileCoverage(fileData: CoverageFileDetails): CoverageSummary {
    const statements = Object.values(fileData.s);
    const functions = Object.values(fileData.f);
    const branches = Object.values(fileData.b).flat();

    const coveredStatements = statements.filter(count => count > 0).length;
    const coveredFunctions = functions.filter(count => count > 0).length;
    const coveredBranches = branches.filter(count => count > 0).length;

    return {
      lines: {
        total: statements.length,
        covered: coveredStatements,
        pct: statements.length > 0 ? Math.round((coveredStatements / statements.length) * 100 * 100) / 100 : 100
      },
      statements: {
        total: statements.length,
        covered: coveredStatements,
        pct: statements.length > 0 ? Math.round((coveredStatements / statements.length) * 100 * 100) / 100 : 100
      },
      functions: {
        total: functions.length,
        covered: coveredFunctions,
        pct: functions.length > 0 ? Math.round((coveredFunctions / functions.length) * 100 * 100) / 100 : 100
      },
      branches: {
        total: branches.length,
        covered: coveredBranches,
        pct: branches.length > 0 ? Math.round((coveredBranches / branches.length) * 100 * 100) / 100 : 100
      }
    };
  }
}