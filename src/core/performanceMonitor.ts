/**
 * パフォーマンス監視システム
 * v0.3.0: 処理時間とメモリ使用量の詳細監視・可視化
 */

import { Issue } from './types';
import { getMessage } from '../i18n/messages';
import * as fs from 'fs/promises';
import * as path from 'path';

export interface PerformanceMetrics {
  processingTime: number;      // 処理時間（ミリ秒）
  memoryUsage: {
    heapUsed: number;         // 使用ヒープメモリ（バイト）
    heapTotal: number;        // 総ヒープメモリ（バイト）
    external: number;         // 外部メモリ（バイト）
    rss: number;              // RSS（Resident Set Size）
  };
  startTime: number;          // 開始時刻
  endTime: number;            // 終了時刻
}

export interface PluginPerformance {
  pluginName: string;
  filePath: string;
  metrics: PerformanceMetrics;
  issuesFound: number;
  errorOccurred: boolean;
}

export interface PerformanceReport {
  totalMetrics: PerformanceMetrics;
  pluginPerformances: PluginPerformance[];
  summary: {
    totalFiles: number;
    totalPlugins: number;
    avgTimePerFile: number;
    avgTimePerPlugin: number;
    slowestPlugin: string;
    fastestPlugin: string;
    memoryPeakUsage: number;
    memoryEfficiency: number;  // MB/s
  };
  detailed: {
    filePerformance: Array<{
      filePath: string;
      totalTime: number;
      pluginCount: number;
      avgTimePerPlugin: number;
    }>;
    pluginPerformance: Array<{
      pluginName: string;
      totalTime: number;
      fileCount: number;
      avgTimePerFile: number;
      errorRate: number;
    }>;
  };
}

export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private pluginPerformances: PluginPerformance[] = [];
  private startTime: number = 0;
  private startMemory: NodeJS.MemoryUsage = process.memoryUsage();
  
  private constructor() {}
  
  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }
  
  /**
   * 監視セッションの開始
   */
  startSession(): void {
    this.pluginPerformances = [];
    this.startTime = Date.now();
    this.startMemory = process.memoryUsage();
  }
  
  /**
   * プラグイン実行の監視開始
   */
  startPluginExecution(pluginName: string, filePath: string): number {
    return Date.now();
  }
  
  /**
   * プラグイン実行の監視終了
   */
  endPluginExecution(
    pluginName: string,
    filePath: string,
    startTime: number,
    issues: Issue[],
    error?: Error
  ): PerformanceMetrics {
    const endTime = Date.now();
    const memoryUsage = process.memoryUsage();
    
    const metrics: PerformanceMetrics = {
      processingTime: endTime - startTime,
      memoryUsage,
      startTime,
      endTime
    };
    
    const performance: PluginPerformance = {
      pluginName,
      filePath,
      metrics,
      issuesFound: issues.length,
      errorOccurred: !!error
    };
    
    this.pluginPerformances.push(performance);
    return metrics;
  }
  
  /**
   * 監視セッションの終了とレポート生成
   */
  endSession(): PerformanceReport {
    const endTime = Date.now();
    const endMemory = process.memoryUsage();
    
    const totalMetrics: PerformanceMetrics = {
      processingTime: endTime - this.startTime,
      memoryUsage: endMemory,
      startTime: this.startTime,
      endTime
    };
    
    const summary = this.calculateSummary(totalMetrics);
    const detailed = this.calculateDetailed();
    
    return {
      totalMetrics,
      pluginPerformances: [...this.pluginPerformances],
      summary,
      detailed
    };
  }
  
  /**
   * パフォーマンスレポートの表示
   */
  displayReport(report: PerformanceReport, verbose: boolean = false): void {
    console.log('\n📊 パフォーマンスレポート');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    // 総合統計
    console.log(`⏱️  総実行時間: ${report.totalMetrics.processingTime}ms`);
    console.log(`📁 処理ファイル数: ${report.summary.totalFiles}`);
    console.log(`🔌 実行プラグイン数: ${report.summary.totalPlugins}`);
    console.log(`📈 平均ファイル処理時間: ${report.summary.avgTimePerFile.toFixed(1)}ms`);
    console.log(`🧩 平均プラグイン処理時間: ${report.summary.avgTimePerPlugin.toFixed(1)}ms`);
    
    // メモリ使用量
    console.log(`\n💾 メモリ使用量:`);
    console.log(`  ヒープ使用量: ${this.formatBytes(report.totalMetrics.memoryUsage.heapUsed)}`);
    console.log(`  ヒープ総量: ${this.formatBytes(report.totalMetrics.memoryUsage.heapTotal)}`);
    console.log(`  外部メモリ: ${this.formatBytes(report.totalMetrics.memoryUsage.external)}`);
    console.log(`  RSS: ${this.formatBytes(report.totalMetrics.memoryUsage.rss)}`);
    console.log(`  メモリ効率: ${report.summary.memoryEfficiency.toFixed(2)} MB/s`);
    
    // パフォーマンス分析
    console.log(`\n🔍 パフォーマンス分析:`);
    console.log(`  最高速プラグイン: ${report.summary.fastestPlugin}`);
    console.log(`  最低速プラグイン: ${report.summary.slowestPlugin}`);
    console.log(`  メモリピーク使用量: ${this.formatBytes(report.summary.memoryPeakUsage)}`);
    
    if (verbose) {
      this.displayDetailedReport(report);
    }
  }
  
  /**
   * 詳細レポートの表示
   */
  private displayDetailedReport(report: PerformanceReport): void {
    console.log(`\n📋 詳細分析:`);
    
    // プラグイン別パフォーマンス
    console.log(`\n🔌 プラグイン別パフォーマンス:`);
    report.detailed.pluginPerformance
      .sort((a, b) => b.totalTime - a.totalTime)
      .slice(0, 5)
      .forEach((plugin, index) => {
        console.log(`  ${index + 1}. ${plugin.pluginName}:`);
        console.log(`     総時間: ${plugin.totalTime}ms`);
        console.log(`     ファイル数: ${plugin.fileCount}`);
        console.log(`     平均時間/ファイル: ${plugin.avgTimePerFile.toFixed(1)}ms`);
        console.log(`     エラー率: ${(plugin.errorRate * 100).toFixed(1)}%`);
      });
    
    // 重いファイル TOP5
    console.log(`\n📁 処理時間が長いファイル TOP5:`);
    report.detailed.filePerformance
      .sort((a, b) => b.totalTime - a.totalTime)
      .slice(0, 5)
      .forEach((file, index) => {
        const relativePath = path.relative(process.cwd(), file.filePath);
        console.log(`  ${index + 1}. ${relativePath}:`);
        console.log(`     処理時間: ${file.totalTime}ms`);
        console.log(`     プラグイン数: ${file.pluginCount}`);
        console.log(`     平均時間/プラグイン: ${file.avgTimePerPlugin.toFixed(1)}ms`);
      });
  }
  
  /**
   * パフォーマンスレポートをJSONファイルに保存
   */
  async saveReport(report: PerformanceReport, outputPath?: string): Promise<string> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = outputPath || `rimor-performance-${timestamp}.json`;
    
    const reportData = {
      timestamp: new Date().toISOString(),
      version: '0.3.0',
      report
    };
    
    await fs.writeFile(filename, JSON.stringify(reportData, null, 2));
    console.log(`📄 パフォーマンスレポートを保存しました: ${filename}`);
    
    return filename;
  }
  
  // プライベートメソッド
  
  private calculateSummary(totalMetrics: PerformanceMetrics): PerformanceReport['summary'] {
    const uniqueFiles = new Set(this.pluginPerformances.map(p => p.filePath));
    const uniquePlugins = new Set(this.pluginPerformances.map(p => p.pluginName));
    
    const totalFiles = uniqueFiles.size;
    const totalPlugins = uniquePlugins.size;
    
    const avgTimePerFile = totalFiles > 0 ? totalMetrics.processingTime / totalFiles : 0;
    const avgTimePerPlugin = this.pluginPerformances.length > 0 ? 
      totalMetrics.processingTime / this.pluginPerformances.length : 0;
    
    // 最速・最低速プラグインの計算
    const pluginTimes = new Map<string, number[]>();
    this.pluginPerformances.forEach(p => {
      if (!pluginTimes.has(p.pluginName)) {
        pluginTimes.set(p.pluginName, []);
      }
      pluginTimes.get(p.pluginName)!.push(p.metrics.processingTime);
    });
    
    let fastestPlugin = '';
    let slowestPlugin = '';
    let fastestAvg = Infinity;
    let slowestAvg = 0;
    
    pluginTimes.forEach((times, pluginName) => {
      const avg = times.reduce((a, b) => a + b, 0) / times.length;
      if (avg < fastestAvg) {
        fastestAvg = avg;
        fastestPlugin = pluginName;
      }
      if (avg > slowestAvg) {
        slowestAvg = avg;
        slowestPlugin = pluginName;
      }
    });
    
    const memoryPeakUsage = Math.max(
      ...this.pluginPerformances.map(p => p.metrics.memoryUsage.heapUsed),
      totalMetrics.memoryUsage.heapUsed
    );
    
    const memoryEfficiency = totalMetrics.processingTime > 0 ? 
      (totalMetrics.memoryUsage.heapUsed / 1024 / 1024) / (totalMetrics.processingTime / 1000) : 0;
    
    return {
      totalFiles,
      totalPlugins,
      avgTimePerFile,
      avgTimePerPlugin,
      fastestPlugin,
      slowestPlugin,
      memoryPeakUsage,
      memoryEfficiency
    };
  }
  
  private calculateDetailed(): PerformanceReport['detailed'] {
    // ファイル別パフォーマンス
    const fileMap = new Map<string, PluginPerformance[]>();
    this.pluginPerformances.forEach(p => {
      if (!fileMap.has(p.filePath)) {
        fileMap.set(p.filePath, []);
      }
      fileMap.get(p.filePath)!.push(p);
    });
    
    const filePerformance = Array.from(fileMap.entries()).map(([filePath, performances]) => {
      const totalTime = performances.reduce((sum, p) => sum + p.metrics.processingTime, 0);
      const pluginCount = performances.length;
      const avgTimePerPlugin = pluginCount > 0 ? totalTime / pluginCount : 0;
      
      return {
        filePath,
        totalTime,
        pluginCount,
        avgTimePerPlugin
      };
    });
    
    // プラグイン別パフォーマンス
    const pluginMap = new Map<string, PluginPerformance[]>();
    this.pluginPerformances.forEach(p => {
      if (!pluginMap.has(p.pluginName)) {
        pluginMap.set(p.pluginName, []);
      }
      pluginMap.get(p.pluginName)!.push(p);
    });
    
    const pluginPerformance = Array.from(pluginMap.entries()).map(([pluginName, performances]) => {
      const totalTime = performances.reduce((sum, p) => sum + p.metrics.processingTime, 0);
      const fileCount = performances.length;
      const avgTimePerFile = fileCount > 0 ? totalTime / fileCount : 0;
      const errorCount = performances.filter(p => p.errorOccurred).length;
      const errorRate = fileCount > 0 ? errorCount / fileCount : 0;
      
      return {
        pluginName,
        totalTime,
        fileCount,
        avgTimePerFile,
        errorRate
      };
    });
    
    return {
      filePerformance,
      pluginPerformance
    };
  }
  
  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';
    
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }
  
  /**
   * 現在の監視状態をリセット
   */
  reset(): void {
    this.pluginPerformances = [];
    this.startTime = 0;
    this.startMemory = process.memoryUsage();
  }
}

/**
 * シングルトンインスタンスへの便利なアクセス
 */
export const performanceMonitor = PerformanceMonitor.getInstance();