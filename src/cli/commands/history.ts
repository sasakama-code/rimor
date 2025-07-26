/**
 * 履歴表示コマンド - v0.4.0 Quality Score Calculator
 * 
 * プロジェクトのスコア履歴を表示・管理
 */

import { ScoreHistoryManager } from '../../scoring/history';
import { TrendAnalysisEngine } from '../../scoring/trends';
import { AdvancedPredictionEngine } from '../../scoring/prediction';
// import { Command } from 'commander'; // Commander not used in this implementation
import * as path from 'path';
import * as fs from 'fs';

export interface HistoryCommandOptions {
  projectPath?: string;
  limit?: string;
  format?: 'table' | 'json' | 'csv';
  trend?: boolean;
  prediction?: boolean;
  stats?: boolean;
  cleanup?: string;
  file?: string;
}

/**
 * 履歴コマンドの実装
 */
export class HistoryCommand {
  private historyManager: ScoreHistoryManager;
  private trendEngine: TrendAnalysisEngine;
  private predictionEngine: AdvancedPredictionEngine;

  constructor() {
    this.historyManager = new ScoreHistoryManager();
    this.trendEngine = new TrendAnalysisEngine();
    this.predictionEngine = new AdvancedPredictionEngine();
  }

  /**
   * コマンド設定用メソッド（現在は使用していない）
   */
  setupCommand(program: any): void {
    const historyCmd = program
      .command('history')
      .description('プロジェクトのスコア履歴を表示・管理')
      .option('-p, --project-path <path>', 'プロジェクトパス', process.cwd())
      .option('-l, --limit <number>', '表示する履歴の件数', '10')
      .option('-f, --format <format>', '出力フォーマット (table|json|csv)', 'table')
      .option('-t, --trend', 'トレンド分析を表示', false)
      .option('-P, --prediction', '予測分析を表示', false)
      .option('-s, --stats', '統計情報を表示', false)
      .option('-c, --cleanup <days>', '指定日数より古い履歴を削除')
      .option('--file <filepath>', '特定ファイルの履歴を表示')
      .action(async (options: HistoryCommandOptions) => {
        await this.executeCommand(options);
      });

    // サブコマンド: clean
    historyCmd
      .command('clean')
      .description('古い履歴ファイルを削除')
      .option('-d, --days <days>', '保持日数', '90')
      .option('-p, --project-path <path>', 'プロジェクトパス', process.cwd())
      .action(async (options: { days?: string; projectPath?: string }) => {
        await this.cleanHistory(options.projectPath || process.cwd(), parseInt(options.days || '90'));
      });

    // サブコマンド: export
    historyCmd
      .command('export')
      .description('履歴データをエクスポート')
      .option('-p, --project-path <path>', 'プロジェクトパス', process.cwd())
      .option('-o, --output <file>', '出力ファイル名', 'rimor-history-export.json')
      .option('-f, --format <format>', 'エクスポート形式 (json|csv)', 'json')
      .action(async (options: { projectPath?: string; output?: string; format?: string }) => {
        await this.exportHistory(options);
      });
  }

  /**
   * メインコマンド実行
   */
  private async executeCommand(options: HistoryCommandOptions): Promise<void> {
    const projectPath = path.resolve(options.projectPath || process.cwd());
    const limit = parseInt(options.limit || '10');

    try {
      if (options.cleanup) {
        const days = parseInt(options.cleanup);
        await this.cleanHistory(projectPath, days);
        return;
      }

      if (options.file) {
        await this.displayFileHistory(projectPath, options.file, options);
        return;
      }

      if (options.stats) {
        await this.displayHistoryStats(projectPath);
        return;
      }

      // 通常の履歴表示
      await this.displayProjectHistory(projectPath, limit, options);

    } catch (error) {
      console.error('履歴コマンドでエラーが発生しました:', error);
      process.exit(1);
    }
  }

  /**
   * プロジェクト履歴の表示
   */
  private async displayProjectHistory(projectPath: string, limit: number, options: HistoryCommandOptions): Promise<void> {
    const recentScores = await this.historyManager.getRecentScores(projectPath, limit);

    if (recentScores.length === 0) {
      console.log('📊 履歴データが見つかりません');
      return;
    }

    switch (options.format) {
      case 'json':
        await this.displayHistoryAsJson(recentScores, options);
        break;
      case 'csv':
        await this.displayHistoryAsCsv(recentScores);
        break;
      default:
        await this.displayHistoryAsTable(recentScores, options);
        break;
    }
  }

  /**
   * テーブル形式での履歴表示
   */
  private async displayHistoryAsTable(scores: any[], options: HistoryCommandOptions): Promise<void> {
    console.log('\\n📊 プロジェクト スコア履歴\\n');
    
    console.log('日付'.padEnd(12) + 'スコア'.padEnd(8) + 'グレード'.padEnd(8) + '変化');
    console.log('─'.repeat(50));

    let previousScore: number | null = null;
    
    for (const score of scores.reverse()) {
      const dateStr = score.date.toISOString().split('T')[0];
      const scoreStr = score.score.toFixed(1);
      const change = previousScore !== null ? 
        (score.score - previousScore > 0 ? `+${(score.score - previousScore).toFixed(1)}` :
         score.score - previousScore < 0 ? `${(score.score - previousScore).toFixed(1)}` : '±0.0') : '-';
      
      const changeIcon = previousScore !== null ?
        (score.score > previousScore ? '📈' :
         score.score < previousScore ? '📉' : '➡️ ') : '  ';

      console.log(
        dateStr.padEnd(12) + 
        scoreStr.padEnd(8) + 
        score.grade.padEnd(8) + 
        `${changeIcon} ${change}`
      );
      
      previousScore = score.score;
    }

    if (options.trend && scores.length >= 3) {
      console.log('\\n📈 トレンド分析');
      const trendMetrics = this.historyManager.calculateTrendMetrics(scores);
      console.log(`トレンド: ${this.getTrendIcon(trendMetrics.trend)} ${trendMetrics.trend}`);
      console.log(`平均変化: ${trendMetrics.averageChange.toFixed(2)}/日`);
      console.log(`変化率: ${trendMetrics.changeRate.toFixed(1)}%`);
      console.log(`一貫性: ${(trendMetrics.consistency * 100).toFixed(1)}%`);
    }

    if (options.prediction && scores.length >= 5) {
      console.log('\\n🔮 予測分析');
      try {
        const prediction = this.predictionEngine.generateEnsemblePrediction(scores);
        console.log(`次週予測: ${prediction.prediction.toFixed(1)} (信頼度: ${(prediction.confidence * 100).toFixed(1)}%)`);
        console.log(`コンセンサス強度: ${(prediction.consensusStrength * 100).toFixed(1)}%`);
      } catch (error) {
        console.log('予測分析でエラーが発生しました:', error);
      }
    }
  }

  /**
   * JSON形式での履歴表示
   */
  private async displayHistoryAsJson(scores: any[], options: HistoryCommandOptions): Promise<void> {
    const result: any = {
      history: scores,
      count: scores.length
    };

    if (options.trend && scores.length >= 3) {
      result.trendAnalysis = this.historyManager.calculateTrendMetrics(scores);
    }

    if (options.prediction && scores.length >= 5) {
      try {
        result.prediction = this.predictionEngine.generateEnsemblePrediction(scores);
      } catch (error) {
        result.predictionError = error instanceof Error ? error.message : String(error);
      }
    }

    console.log(JSON.stringify(result, null, 2));
  }

  /**
   * CSV形式での履歴表示
   */
  private async displayHistoryAsCsv(scores: any[]): Promise<void> {
    console.log('date,score,grade');
    for (const score of scores) {
      console.log(`${score.date.toISOString().split('T')[0]},${score.score},${score.grade}`);
    }
  }

  /**
   * 特定ファイルの履歴表示
   */
  private async displayFileHistory(projectPath: string, filePath: string, options: HistoryCommandOptions): Promise<void> {
    const fileHistory = await this.historyManager.getFileScoreHistory(projectPath, filePath);

    if (fileHistory.length === 0) {
      console.log(`📄 ファイル "${filePath}" の履歴データが見つかりません`);
      return;
    }

    console.log(`\\n📄 ファイル履歴: ${filePath}\\n`);

    switch (options.format) {
      case 'json':
        console.log(JSON.stringify(fileHistory, null, 2));
        break;
      case 'csv':
        console.log('date,score,grade');
        for (const entry of fileHistory) {
          console.log(`${entry.timestamp.toISOString().split('T')[0]},${entry.score},${entry.grade}`);
        }
        break;
      default:
        console.log('日付'.padEnd(12) + 'スコア'.padEnd(8) + 'グレード');
        console.log('─'.repeat(28));
        
        for (const entry of fileHistory) {
          const dateStr = entry.timestamp.toISOString().split('T')[0];
          console.log(dateStr.padEnd(12) + entry.score.toFixed(1).padEnd(8) + entry.grade);
        }
        break;
    }
  }

  /**
   * 履歴統計の表示
   */
  private async displayHistoryStats(projectPath: string): Promise<void> {
    const stats = await this.historyManager.getHistoryStats(projectPath);

    console.log('\\n📊 履歴統計\\n');
    console.log(`総エントリ数: ${stats.totalEntries}`);
    console.log(`分析ファイル数: ${stats.totalFiles}`);
    
    if (stats.dateRange) {
      console.log(`期間: ${stats.dateRange.start.toISOString().split('T')[0]} - ${stats.dateRange.end.toISOString().split('T')[0]}`);
    }
    
    console.log(`平均スコア: ${stats.averageScore}`);
    console.log(`最高スコア: ${stats.bestScore}`);
    console.log(`最低スコア: ${stats.worstScore}`);
    
    const range = stats.bestScore - stats.worstScore;
    console.log(`スコア範囲: ${range.toFixed(1)}`);
  }

  /**
   * 履歴のクリーンアップ
   */
  private async cleanHistory(projectPath: string, retentionDays: number): Promise<void> {
    console.log(`🧹 ${retentionDays}日より古い履歴ファイルを削除中...`);
    
    const cleanedCount = await this.historyManager.cleanOldHistory(projectPath, retentionDays);
    
    if (cleanedCount > 0) {
      console.log(`✅ ${cleanedCount}個の古い履歴ファイルを削除しました`);
    } else {
      console.log('削除対象の履歴ファイルはありませんでした');
    }
  }

  /**
   * 履歴のエクスポート
   */
  private async exportHistory(options: { projectPath?: string; output?: string; format?: string }): Promise<void> {
    const projectPath = path.resolve(options.projectPath || process.cwd());
    const outputFile = path.resolve(options.output || 'rimor-history-export.json');
    const format = options.format || 'json';

    console.log(`📤 履歴データをエクスポート中: ${outputFile}`);

    try {
      const history = await this.historyManager.loadHistoryForProject(projectPath);
      const stats = await this.historyManager.getHistoryStats(projectPath);

      const exportData = {
        metadata: {
          exportedAt: new Date().toISOString(),
          projectPath,
          version: '0.4.0'
        },
        statistics: stats,
        history: history.entries
      };

      if (format === 'csv') {
        // CSV形式のエクスポート
        let csvContent = 'timestamp,score,grade,commit,branch\\n';
        
        for (const entry of history.entries) {
          const timestamp = entry.timestamp instanceof Date ? entry.timestamp.toISOString() : new Date(entry.timestamp).toISOString();
          csvContent += `${timestamp},${entry.scores.project.overallScore},${entry.scores.project.grade},${entry.commit || ''},${entry.branch || ''}\\n`;
        }
        
        fs.writeFileSync(outputFile, csvContent, 'utf-8');
      } else {
        // JSON形式のエクスポート
        fs.writeFileSync(outputFile, JSON.stringify(exportData, null, 2), 'utf-8');
      }

      console.log(`✅ エクスポート完了: ${outputFile}`);
      console.log(`📊 ${history.entries.length}件のエントリをエクスポートしました`);

    } catch (error) {
      console.error('エクスポートでエラーが発生しました:', error);
      process.exit(1);
    }
  }

  /**
   * トレンドアイコンの取得
   */
  private getTrendIcon(trend: 'improving' | 'declining' | 'stable'): string {
    switch (trend) {
      case 'improving': return '📈';
      case 'declining': return '📉';
      case 'stable': return '➡️';
      default: return '❓';
    }
  }
}