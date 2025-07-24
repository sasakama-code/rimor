import { ScoreHistoryManager } from '../../src/scoring/history';
import { 
  ProjectScore, 
  FileScore, 
  DEFAULT_WEIGHTS 
} from '../../src/scoring/types';
import path from 'path';
import fs from 'fs';

describe('ScoreHistoryManager', () => {
  let historyManager: ScoreHistoryManager;
  const testHistoryDir = path.join(__dirname, '../fixtures/history');

  beforeEach(() => {
    historyManager = new ScoreHistoryManager();
    
    // テスト用履歴ディレクトリを作成
    if (!fs.existsSync(testHistoryDir)) {
      fs.mkdirSync(testHistoryDir, { recursive: true });
    }
  });

  afterEach(() => {
    // テスト用ファイルをクリーンアップ
    if (fs.existsSync(testHistoryDir)) {
      fs.rmSync(testHistoryDir, { recursive: true, force: true });
    }
  });

  describe('saveProjectScore', () => {
    test('should save project score to history file', async () => {
      const projectScore = createMockProjectScore(85, 'B');
      
      await historyManager.saveProjectScore(testHistoryDir, projectScore);
      
      const historyFiles = fs.readdirSync(testHistoryDir);
      expect(historyFiles.length).toBe(1);
      expect(historyFiles[0]).toMatch(/rimor-history-\d{4}-\d{2}-\d{2}\.json/);
      
      const historyContent = JSON.parse(fs.readFileSync(path.join(testHistoryDir, historyFiles[0]), 'utf-8'));
      expect(historyContent.entries).toHaveLength(1);
      expect(historyContent.entries[0].scores.project.overallScore).toBe(85);
    });

    test('should append to existing history file for same date', async () => {
      const score1 = createMockProjectScore(80, 'B');
      const score2 = createMockProjectScore(85, 'B');
      
      await historyManager.saveProjectScore(testHistoryDir, score1);
      await historyManager.saveProjectScore(testHistoryDir, score2);
      
      const historyFiles = fs.readdirSync(testHistoryDir);
      expect(historyFiles.length).toBe(1);
      
      const historyContent = JSON.parse(fs.readFileSync(path.join(testHistoryDir, historyFiles[0]), 'utf-8'));
      expect(historyContent.entries).toHaveLength(2);
      expect(historyContent.entries[0].scores.project.overallScore).toBe(80);
      expect(historyContent.entries[1].scores.project.overallScore).toBe(85);
    });

    test('should include git commit information when available', async () => {
      const projectScore = createMockProjectScore(90, 'A');
      
      await historyManager.saveProjectScore(testHistoryDir, projectScore, {
        commit: 'abc123',
        branch: 'main'
      });
      
      const historyFiles = fs.readdirSync(testHistoryDir);
      const historyContent = JSON.parse(fs.readFileSync(path.join(testHistoryDir, historyFiles[0]), 'utf-8'));
      
      expect(historyContent.entries[0].commit).toBe('abc123');
      expect(historyContent.entries[0].branch).toBe('main');
    });
  });

  describe('loadHistoryForProject', () => {
    test('should load complete history for project', async () => {
      // 複数日のスコアを保存
      await historyManager.saveProjectScore(testHistoryDir, createMockProjectScore(75, 'C'));
      await historyManager.saveProjectScore(testHistoryDir, createMockProjectScore(80, 'B'));
      await historyManager.saveProjectScore(testHistoryDir, createMockProjectScore(85, 'B'));
      
      const history = await historyManager.loadHistoryForProject(testHistoryDir);
      
      expect(history.entries).toHaveLength(3);
      expect(history.entries[0].scores.project.overallScore).toBe(75);
      expect(history.entries[1].scores.project.overallScore).toBe(80);
      expect(history.entries[2].scores.project.overallScore).toBe(85);
    });

    test('should return empty history when no files exist', async () => {
      const history = await historyManager.loadHistoryForProject('/nonexistent/path');
      
      expect(history.entries).toHaveLength(0);
      expect(history.version).toBe('1.0');
      expect(history.projectId).toBeDefined();
    });

    test('should sort entries by timestamp', async () => {
      const now = Date.now();
      const score1 = createMockProjectScore(70, 'C');
      const score2 = createMockProjectScore(75, 'C');
      const score3 = createMockProjectScore(80, 'B');
      
      // 時間をずらして保存
      score1.metadata.generatedAt = new Date(now - 2000);
      score2.metadata.generatedAt = new Date(now - 1000);
      score3.metadata.generatedAt = new Date(now);
      
      await historyManager.saveProjectScore(testHistoryDir, score2);
      await historyManager.saveProjectScore(testHistoryDir, score1);
      await historyManager.saveProjectScore(testHistoryDir, score3);
      
      const history = await historyManager.loadHistoryForProject(testHistoryDir);
      
      expect(history.entries).toHaveLength(3);
      expect(history.entries[0].scores.project.overallScore).toBe(70);
      expect(history.entries[1].scores.project.overallScore).toBe(75);
      expect(history.entries[2].scores.project.overallScore).toBe(80);
    });
  });

  describe('getRecentScores', () => {
    test('should return recent scores within specified limit', async () => {
      // 5つのスコアを保存
      for (let i = 0; i < 5; i++) {
        await historyManager.saveProjectScore(testHistoryDir, createMockProjectScore(70 + i * 5, 'C'));
      }
      
      const recentScores = await historyManager.getRecentScores(testHistoryDir, 3);
      
      expect(recentScores).toHaveLength(3);
      expect(recentScores[0].score).toBe(90); // 最新
      expect(recentScores[1].score).toBe(85);
      expect(recentScores[2].score).toBe(80);
    });

    test('should return all scores when limit exceeds available data', async () => {
      await historyManager.saveProjectScore(testHistoryDir, createMockProjectScore(75, 'C'));
      await historyManager.saveProjectScore(testHistoryDir, createMockProjectScore(80, 'B'));
      
      const recentScores = await historyManager.getRecentScores(testHistoryDir, 10);
      
      expect(recentScores).toHaveLength(2);
    });

    test('should return empty array when no history exists', async () => {
      const recentScores = await historyManager.getRecentScores('/nonexistent', 5);
      
      expect(recentScores).toHaveLength(0);
    });
  });

  describe('calculateTrendMetrics', () => {
    test('should calculate improvement trend correctly', async () => {
      const scores = [
        { date: new Date('2024-01-01'), score: 70, grade: 'C' as const },
        { date: new Date('2024-01-02'), score: 75, grade: 'C' as const },
        { date: new Date('2024-01-03'), score: 80, grade: 'B' as const },
        { date: new Date('2024-01-04'), score: 85, grade: 'B' as const }
      ];
      
      const metrics = historyManager.calculateTrendMetrics(scores);
      
      expect(metrics.trend).toBe('improving');
      expect(metrics.averageChange).toBeCloseTo(5, 1);
      expect(metrics.changeRate).toBeGreaterThan(0);
      expect(metrics.volatility).toBe(0); // 一定の変化なので変動性は0
    });

    test('should calculate declining trend correctly', async () => {
      const scores = [
        { date: new Date('2024-01-01'), score: 90, grade: 'A' as const },
        { date: new Date('2024-01-02'), score: 85, grade: 'B' as const },
        { date: new Date('2024-01-03'), score: 80, grade: 'B' as const },
        { date: new Date('2024-01-04'), score: 75, grade: 'C' as const }
      ];
      
      const metrics = historyManager.calculateTrendMetrics(scores);
      
      expect(metrics.trend).toBe('declining');
      expect(metrics.averageChange).toBeCloseTo(-5, 1);
      expect(metrics.changeRate).toBeLessThan(0);
    });

    test('should calculate stable trend correctly', async () => {
      const scores = [
        { date: new Date('2024-01-01'), score: 80, grade: 'B' as const },
        { date: new Date('2024-01-02'), score: 81, grade: 'B' as const },
        { date: new Date('2024-01-03'), score: 79, grade: 'C' as const },
        { date: new Date('2024-01-04'), score: 80, grade: 'B' as const }
      ];
      
      const metrics = historyManager.calculateTrendMetrics(scores);
      
      expect(metrics.trend).toBe('stable');
      expect(Math.abs(metrics.averageChange)).toBeLessThan(1);
    });

    test('should handle empty score array', async () => {
      const metrics = historyManager.calculateTrendMetrics([]);
      
      expect(metrics.trend).toBe('stable');
      expect(metrics.averageChange).toBe(0);
      expect(metrics.changeRate).toBe(0);
      expect(metrics.volatility).toBe(0);
    });
  });

  describe('cleanOldHistory', () => {
    test('should remove history files older than specified days', async () => {
      const now = new Date();
      const oldDate = new Date(now.getTime() - 35 * 24 * 60 * 60 * 1000); // 35日前
      const recentDate = new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000);  // 5日前
      
      // 古いファイルと新しいファイルを作成
      const oldFileName = `rimor-history-${oldDate.getFullYear()}-${String(oldDate.getMonth() + 1).padStart(2, '0')}-${String(oldDate.getDate()).padStart(2, '0')}.json`;
      const recentFileName = `rimor-history-${recentDate.getFullYear()}-${String(recentDate.getMonth() + 1).padStart(2, '0')}-${String(recentDate.getDate()).padStart(2, '0')}.json`;
      
      fs.writeFileSync(path.join(testHistoryDir, oldFileName), JSON.stringify({ entries: [] }));
      fs.writeFileSync(path.join(testHistoryDir, recentFileName), JSON.stringify({ entries: [] }));
      
      const cleanedCount = await historyManager.cleanOldHistory(testHistoryDir, 30);
      
      expect(cleanedCount).toBe(1);
      expect(fs.existsSync(path.join(testHistoryDir, oldFileName))).toBe(false);
      expect(fs.existsSync(path.join(testHistoryDir, recentFileName))).toBe(true);
    });

    test('should not remove files within retention period', async () => {
      await historyManager.saveProjectScore(testHistoryDir, createMockProjectScore(80, 'B'));
      
      const cleanedCount = await historyManager.cleanOldHistory(testHistoryDir, 30);
      
      expect(cleanedCount).toBe(0);
      const historyFiles = fs.readdirSync(testHistoryDir);
      expect(historyFiles.length).toBe(1);
    });
  });

  describe('getFileScoreHistory', () => {
    test('should return score history for specific file', async () => {
      const score1 = createMockProjectScore(80, 'B');
      const score2 = createMockProjectScore(85, 'B');
      
      // 特定ファイルのスコアを設定
      score1.fileScores[0].overallScore = 75;
      score2.fileScores[0].overallScore = 80;
      
      await historyManager.saveProjectScore(testHistoryDir, score1);
      await historyManager.saveProjectScore(testHistoryDir, score2);
      
      const fileHistory = await historyManager.getFileScoreHistory(testHistoryDir, 'src/test.ts');
      
      expect(fileHistory).toHaveLength(2);
      expect(fileHistory[0].score).toBe(75);
      expect(fileHistory[1].score).toBe(80);
    });

    test('should return empty array for non-existent file', async () => {
      await historyManager.saveProjectScore(testHistoryDir, createMockProjectScore(80, 'B'));
      
      const fileHistory = await historyManager.getFileScoreHistory(testHistoryDir, 'nonexistent.ts');
      
      expect(fileHistory).toHaveLength(0);
    });
  });

  // Helper function
  function createMockProjectScore(score: number, grade: 'A' | 'B' | 'C' | 'D' | 'F'): ProjectScore {
    const mockFileScore: FileScore = {
      filePath: 'src/test.ts',
      overallScore: score,
      dimensions: {
        completeness: { score: score, weight: 1.0, issues: [] },
        correctness: { score: score, weight: 1.5, issues: [] },
        maintainability: { score: score, weight: 1.0, issues: [] },
        performance: { score: score, weight: 0.8, issues: [] },
        security: { score: score, weight: 1.2, issues: [] }
      },
      grade,
      weights: DEFAULT_WEIGHTS,
      metadata: {
        analysisTime: 100,
        pluginResults: [],
        issueCount: 0
      }
    };

    return {
      projectPath: '/test/project',
      overallScore: score,
      grade,
      totalFiles: 1,
      totalDirectories: 1,
      fileScores: [mockFileScore],
      directoryScores: [],
      weights: DEFAULT_WEIGHTS,
      metadata: {
        generatedAt: new Date(),
        executionTime: 150,
        pluginCount: 2,
        issueCount: 0
      }
    };
  }
});