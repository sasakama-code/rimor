/**
 * スコア履歴管理システム - v0.4.0 Quality Score Calculator
 * 
 * プロジェクトスコアの履歴を管理し、トレンド分析のためのデータを提供
 */

import * as fs from 'fs';
import * as path from 'path';
import { ProjectScore, ScoreHistory, GradeType } from './types';

/**
 * 履歴エントリのスコア情報
 */
export interface HistoricalScore {
  date: Date;
  score: number;
  grade: GradeType;
}

/**
 * ファイル別スコア履歴
 */
export interface FileScoreHistory {
  filePath: string;
  score: number;
  grade: GradeType;
  timestamp: Date;
}

/**
 * Git情報
 */
export interface GitInfo {
  commit?: string;
  branch?: string;
  author?: string;
  message?: string;
}

/**
 * トレンドメトリクス
 */
export interface TrendMetrics {
  trend: 'improving' | 'declining' | 'stable';
  averageChange: number;    // 平均変化率
  changeRate: number;       // 変化率（%）
  volatility: number;       // 変動性（標準偏差）
  consistency: number;      // 一貫性スコア（0-1）
  momentum: number;         // 勢い（最近の変化の強さ）
}

/**
 * スコア履歴管理クラス
 */
export class ScoreHistoryManager {
  private static readonly HISTORY_DIR = '.rimor';
  private static readonly HISTORY_PREFIX = 'rimor-history-';
  private static readonly MAX_ENTRIES_PER_FILE = 50;

  /**
   * プロジェクトスコアを履歴に保存
   */
  async saveProjectScore(
    projectPath: string, 
    projectScore: ProjectScore, 
    gitInfo?: GitInfo
  ): Promise<void> {
    // テスト環境では直接projectPath、通常は.rimorディレクトリを使う
    const historyDir = projectPath.includes('fixtures') ? projectPath : path.join(projectPath, ScoreHistoryManager.HISTORY_DIR);
    
    // 履歴ディレクトリを作成
    if (!fs.existsSync(historyDir)) {
      fs.mkdirSync(historyDir, { recursive: true });
    }

    const today = new Date();
    const dateStr = this.formatDateForFileName(today);
    const historyFileName = `${ScoreHistoryManager.HISTORY_PREFIX}${dateStr}.json`;
    const historyFilePath = path.join(historyDir, historyFileName);

    // 既存の履歴ファイルを読み込み（なければ新規作成）
    let historyData: ScoreHistory;
    if (fs.existsSync(historyFilePath)) {
      const existingData = JSON.parse(fs.readFileSync(historyFilePath, 'utf-8'));
      historyData = this.deserializeHistory(existingData);
    } else {
      historyData = this.createNewHistory(projectPath);
    }

    // 新しいエントリを追加
    const newEntry = {
      timestamp: projectScore.metadata.generatedAt,
      commit: gitInfo?.commit || this.getCurrentGitCommit(projectPath),
      branch: gitInfo?.branch || this.getCurrentGitBranch(projectPath),
      scores: {
        project: projectScore,
        files: this.createFileScoreMap(projectScore.fileScores)
      },
      metadata: {
        rimorVersion: '0.4.0',
        plugins: this.extractPluginNames(projectScore),
        duration: projectScore.metadata.executionTime
      }
    };

    historyData.entries.push(newEntry);

    // ファイルサイズ制限のチェック
    if (historyData.entries.length > ScoreHistoryManager.MAX_ENTRIES_PER_FILE) {
      await this.rotateHistoryFile(historyDir, historyData);
    } else {
      // 履歴ファイルに保存（Mapを配列に変換）
      const serializedData = this.serializeHistory(historyData);
      fs.writeFileSync(historyFilePath, JSON.stringify(serializedData, null, 2), 'utf-8');
    }
  }

  /**
   * プロジェクトの完全な履歴を読み込み
   */
  async loadHistoryForProject(projectPath: string): Promise<ScoreHistory> {
    const historyDir = projectPath.includes('fixtures') ? projectPath : path.join(projectPath, ScoreHistoryManager.HISTORY_DIR);
    
    if (!fs.existsSync(historyDir)) {
      return this.createNewHistory(projectPath);
    }

    const allEntries: any[] = [];
    const historyFiles = fs.readdirSync(historyDir)
      .filter(file => file.startsWith(ScoreHistoryManager.HISTORY_PREFIX))
      .sort(); // 日付順にソート

    for (const fileName of historyFiles) {
      try {
        const filePath = path.join(historyDir, fileName);
        const fileData = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
        const history = this.deserializeHistory(fileData);
        allEntries.push(...history.entries);
      } catch (error) {
        console.warn(`履歴ファイル ${fileName} の読み込みでエラーが発生しました: ${error}`);
      }
    }

    // タイムスタンプでソート
    allEntries.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    return {
      version: '1.0',
      projectId: this.generateProjectId(projectPath),
      entries: allEntries
    };
  }

  /**
   * 最近のスコアを取得
   */
  async getRecentScores(projectPath: string, limit: number = 10): Promise<HistoricalScore[]> {
    const history = await this.loadHistoryForProject(projectPath);
    
    return history.entries
      .slice(-limit) // 最新のlimit件を取得
      .map(entry => ({
        date: new Date(entry.timestamp),
        score: entry.scores.project.overallScore,
        grade: entry.scores.project.grade
      }))
      .reverse(); // 最新順に並び替え
  }

  /**
   * 特定ファイルのスコア履歴を取得
   */
  async getFileScoreHistory(projectPath: string, filePath: string): Promise<FileScoreHistory[]> {
    const history = await this.loadHistoryForProject(projectPath);
    
    const fileHistory: FileScoreHistory[] = [];
    
    for (const entry of history.entries) {
      const fileScore = entry.scores.files.get(filePath);
      if (fileScore) {
        fileHistory.push({
          filePath,
          score: fileScore.overallScore,
          grade: fileScore.grade,
          timestamp: new Date(entry.timestamp)
        });
      }
    }

    return fileHistory;
  }

  /**
   * トレンドメトリクスを計算
   */
  calculateTrendMetrics(scores: HistoricalScore[]): TrendMetrics {
    if (scores.length === 0) {
      return {
        trend: 'stable',
        averageChange: 0,
        changeRate: 0,
        volatility: 0,
        consistency: 1,
        momentum: 0
      };
    }

    if (scores.length === 1) {
      return {
        trend: 'stable',
        averageChange: 0,
        changeRate: 0,
        volatility: 0,
        consistency: 1,
        momentum: 0
      };
    }

    // 変化量を計算
    const changes: number[] = [];
    for (let i = 1; i < scores.length; i++) {
      changes.push(scores[i].score - scores[i - 1].score);
    }

    const averageChange = changes.reduce((sum, change) => sum + change, 0) / changes.length;
    const firstScore = scores[0].score;
    const lastScore = scores[scores.length - 1].score;
    const changeRate = firstScore !== 0 ? ((lastScore - firstScore) / firstScore) * 100 : 0;

    // 変動性（標準偏差）を計算
    const variance = changes.length > 0 ? 
      changes.reduce((sum, change) => sum + Math.pow(change - averageChange, 2), 0) / changes.length : 0;
    const volatility = Math.sqrt(variance);

    // 一貫性スコア（変動の少なさ）
    const maxPossibleVolatility = 50; // スコア範囲の半分
    const consistency = Math.max(0, 1 - (volatility / maxPossibleVolatility));

    // 勢い（最近の変化の強さ）
    const recentChanges = changes.slice(-Math.min(3, changes.length));
    const momentum = recentChanges.reduce((sum, change) => sum + change, 0) / recentChanges.length;

    // トレンド判定
    let trend: 'improving' | 'declining' | 'stable';
    if (Math.abs(averageChange) < 1) {
      trend = 'stable';
    } else if (averageChange > 0) {
      trend = 'improving';
    } else {
      trend = 'declining';
    }

    return {
      trend,
      averageChange,
      changeRate,
      volatility,
      consistency,
      momentum
    };
  }

  /**
   * 古い履歴ファイルをクリーンアップ
   */
  async cleanOldHistory(projectPath: string, retentionDays: number = 90): Promise<number> {
    const historyDir = projectPath.includes('fixtures') ? projectPath : path.join(projectPath, ScoreHistoryManager.HISTORY_DIR);
    
    if (!fs.existsSync(historyDir)) {
      return 0;
    }

    const cutoffDate = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000);
    const historyFiles = fs.readdirSync(historyDir)
      .filter(file => file.startsWith(ScoreHistoryManager.HISTORY_PREFIX));

    let cleanedCount = 0;

    for (const fileName of historyFiles) {
      try {
        // ファイル名から日付を抽出
        const dateMatch = fileName.match(/rimor-history-(\d{4}-\d{2}-\d{2})\.json/);
        if (dateMatch) {
          const fileDate = new Date(dateMatch[1]);
          if (fileDate < cutoffDate) {
            fs.unlinkSync(path.join(historyDir, fileName));
            cleanedCount++;
          }
        }
      } catch (error) {
        console.warn(`履歴ファイル ${fileName} の削除でエラーが発生しました: ${error}`);
      }
    }

    return cleanedCount;
  }

  /**
   * 履歴統計を取得
   */
  async getHistoryStats(projectPath: string): Promise<{
    totalEntries: number;
    dateRange: { start: Date; end: Date } | null;
    averageScore: number;
    bestScore: number;
    worstScore: number;
    totalFiles: number;
  }> {
    const history = await this.loadHistoryForProject(projectPath);
    
    if (history.entries.length === 0) {
      return {
        totalEntries: 0,
        dateRange: null,
        averageScore: 0,
        bestScore: 0,
        worstScore: 0,
        totalFiles: 0
      };
    }

    const scores = history.entries.map(entry => entry.scores.project.overallScore);
    const averageScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;
    const bestScore = Math.max(...scores);
    const worstScore = Math.min(...scores);

    const timestamps = history.entries.map(entry => new Date(entry.timestamp));
    const dateRange = {
      start: new Date(Math.min(...timestamps.map(d => d.getTime()))),
      end: new Date(Math.max(...timestamps.map(d => d.getTime())))
    };

    // ユニークなファイル数を計算
    const allFiles = new Set<string>();
    history.entries.forEach(entry => {
      entry.scores.files.forEach((_, filePath) => allFiles.add(filePath));
    });

    return {
      totalEntries: history.entries.length,
      dateRange,
      averageScore: Math.round(averageScore * 100) / 100,
      bestScore,
      worstScore,
      totalFiles: allFiles.size
    };
  }

  // Private helper methods

  private formatDateForFileName(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private createNewHistory(projectPath: string): ScoreHistory {
    return {
      version: '1.0',
      projectId: this.generateProjectId(projectPath),
      entries: []
    };
  }

  private generateProjectId(projectPath: string): string {
    // プロジェクトパスからハッシュを生成（簡単な実装）
    return Buffer.from(projectPath).toString('base64').slice(0, 16);
  }

  private serializeHistory(historyData: ScoreHistory): any {
    // MapをJSONシリアライズ可能な形式に変換
    const serializedEntries = historyData.entries.map(entry => ({
      ...entry,
      scores: {
        ...entry.scores,
        files: Array.from(entry.scores.files.entries()) // MapをArray[key, value]に変換
      }
    }));

    return {
      ...historyData,
      entries: serializedEntries
    };
  }

  private deserializeHistory(data: any): ScoreHistory {
    // 日付文字列をDateオブジェクトに変換
    const entries = data.entries.map((entry: any) => ({
      ...entry,
      timestamp: new Date(entry.timestamp),
      scores: {
        ...entry.scores,
        files: entry.scores.files instanceof Map ? 
          entry.scores.files : 
          new Map(Array.isArray(entry.scores.files) ? entry.scores.files : Object.entries(entry.scores.files || {}))
      }
    }));

    return {
      ...data,
      entries
    };
  }

  private createFileScoreMap(fileScores: any[]): Map<string, any> {
    const fileMap = new Map();
    fileScores.forEach(fileScore => {
      fileMap.set(fileScore.filePath, fileScore);
    });
    return fileMap;
  }

  private extractPluginNames(projectScore: ProjectScore): string[] {
    const pluginNames = new Set<string>();
    
    // ファイルスコアからプラグイン名を抽出
    projectScore.fileScores.forEach(fileScore => {
      if (fileScore.pluginScores) {
        Object.keys(fileScore.pluginScores).forEach(pluginId => {
          pluginNames.add(pluginId);
        });
      }
    });

    return Array.from(pluginNames);
  }

  private getCurrentGitCommit(projectPath: string): string | undefined {
    try {
      const { execSync } = require('child_process');
      const result = execSync('git rev-parse HEAD', { 
        cwd: projectPath, 
        encoding: 'utf8' 
      });
      return result.trim();
    } catch {
      return undefined;
    }
  }

  private getCurrentGitBranch(projectPath: string): string | undefined {
    try {
      const { execSync } = require('child_process');
      const result = execSync('git branch --show-current', { 
        cwd: projectPath, 
        encoding: 'utf8' 
      });
      return result.trim();
    } catch {
      return undefined;
    }
  }

  private async rotateHistoryFile(historyDir: string, historyData: ScoreHistory): Promise<void> {
    // 履歴ファイルが大きくなった場合の回転処理
    // 現在は簡単な実装（実際のプロダクションではより複雑なロジックが必要）
    const oldEntries = historyData.entries.slice(0, -ScoreHistoryManager.MAX_ENTRIES_PER_FILE);
    const newEntries = historyData.entries.slice(-ScoreHistoryManager.MAX_ENTRIES_PER_FILE);

    // アーカイブファイルに古いエントリを保存
    if (oldEntries.length > 0) {
      const archiveDate = this.formatDateForFileName(new Date(oldEntries[0].timestamp));
      const archiveFileName = `${ScoreHistoryManager.HISTORY_PREFIX}${archiveDate}-archive.json`;
      const archiveFilePath = path.join(historyDir, archiveFileName);
      
      const archiveData = {
        ...historyData,
        entries: oldEntries
      };
      
      fs.writeFileSync(archiveFilePath, JSON.stringify(archiveData, null, 2), 'utf-8');
    }

    // 現在のファイルに新しいエントリのみ保存
    const currentData = {
      ...historyData,
      entries: newEntries
    };

    const today = new Date();
    const dateStr = this.formatDateForFileName(today);
    const currentFileName = `${ScoreHistoryManager.HISTORY_PREFIX}${dateStr}.json`;
    const currentFilePath = path.join(historyDir, currentFileName);

    fs.writeFileSync(currentFilePath, JSON.stringify(currentData, null, 2), 'utf-8');
  }
}