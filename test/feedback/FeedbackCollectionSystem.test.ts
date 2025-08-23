/**
 * FeedbackCollectionSystemのテスト
 * Issue #66: 実質的品質向上のためのテスト
 * TDD RED段階: ビジネス価値を検証する失敗テスト
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { FeedbackCollectionSystem } from '../../src/feedback/FeedbackCollectionSystem';

// モックの設定
jest.mock('fs/promises');

describe('FeedbackCollectionSystem', () => {
  let system: FeedbackCollectionSystem;
  const testProjectPath = '/test/project';

  beforeEach(() => {
    system = new FeedbackCollectionSystem();
    jest.clearAllMocks();
  });

  describe('フィードバック収集の品質保証', () => {
    describe('正確なデータ収集', () => {
      it('ユーザーフィードバックを正確に記録する', async () => {
        // Arrange
        const feedback = {
          issueId: 'test-001',
          falsePositive: true,
          actualSeverity: 'low',
          userComment: 'This is not a real issue in our context',
          timestamp: new Date()
        };

        // Act
        await system.recordFeedback(feedback);
        const recorded = await system.getFeedback('test-001');

        // Assert
        expect(recorded).toEqual(feedback);
        expect(recorded?.falsePositive).toBe(true);
        expect(recorded?.actualSeverity).toBe('low');
      });

      it('複数のフィードバックを損失なく保存する', async () => {
        // Arrange
        const feedbacks = [
          { issueId: 'test-001', falsePositive: true },
          { issueId: 'test-002', falsePositive: false },
          { issueId: 'test-003', falsePositive: true }
        ];

        // Act
        for (const feedback of feedbacks) {
          await system.recordFeedback(feedback);
        }
        const allFeedback = await system.getAllFeedback();

        // Assert
        expect(allFeedback).toHaveLength(3);
        expect(allFeedback.filter(f => f.falsePositive)).toHaveLength(2);
      });

      it('同じissueIdのフィードバックを適切に更新する', async () => {
        // Arrange
        const initial = { issueId: 'test-001', falsePositive: false };
        const updated = { issueId: 'test-001', falsePositive: true, userComment: 'Updated' };

        // Act
        await system.recordFeedback(initial);
        await system.recordFeedback(updated);
        const result = await system.getFeedback('test-001');

        // Assert
        expect(result?.falsePositive).toBe(true);
        expect(result?.userComment).toBe('Updated');
      });
    });

    describe('データ永続化の信頼性', () => {
      it('システム再起動後もフィードバックを保持する', async () => {
        // Arrange
        const feedback = { issueId: 'persistent-001', falsePositive: true };
        (fs.readFile as jest.Mock).mockResolvedValue(JSON.stringify([feedback]));

        // Act
        const newSystem = new FeedbackCollectionSystem();
        await newSystem.loadPersistedFeedback();
        const loaded = await newSystem.getFeedback('persistent-001');

        // Assert
        expect(loaded).toEqual(feedback);
      });

      it('ディスク書き込み失敗時にメモリ内データを保持する', async () => {
        // Arrange
        const feedback = { issueId: 'test-001', falsePositive: true };
        (fs.writeFile as jest.Mock).mockRejectedValue(new Error('Disk full'));

        // Act
        await system.recordFeedback(feedback);
        const inMemory = await system.getFeedback('test-001');

        // Assert
        expect(inMemory).toEqual(feedback);
        expect(system.hasPendingWrites()).toBe(true);
      });
    });
  });

  describe('分析精度の保証', () => {
    describe('偽陽性率の正確な計算', () => {
      it('偽陽性率を正しく計算する', async () => {
        // Arrange
        const feedbacks = [
          { issueId: 'test-001', falsePositive: true },
          { issueId: 'test-002', falsePositive: false },
          { issueId: 'test-003', falsePositive: true },
          { issueId: 'test-004', falsePositive: false },
          { issueId: 'test-005', falsePositive: true }
        ];

        // Act
        for (const feedback of feedbacks) {
          await system.recordFeedback(feedback);
        }
        const analysis = await system.analyzeFalsePositiveRate();

        // Assert
        expect(analysis.rate).toBeCloseTo(0.6, 2); // 3/5 = 0.6
        expect(analysis.total).toBe(5);
        expect(analysis.falsePositives).toBe(3);
      });

      it('ルールごとの偽陽性率を分析する', async () => {
        // Arrange
        const feedbacks = [
          { issueId: 'test-001', rule: 'no-unused-vars', falsePositive: true },
          { issueId: 'test-002', rule: 'no-unused-vars', falsePositive: true },
          { issueId: 'test-003', rule: 'no-console', falsePositive: false },
          { issueId: 'test-004', rule: 'no-console', falsePositive: false }
        ];

        // Act
        for (const feedback of feedbacks) {
          await system.recordFeedback(feedback);
        }
        const analysis = await system.analyzeByRule();

        // Assert
        expect(analysis['no-unused-vars'].falsePositiveRate).toBe(1.0);
        expect(analysis['no-console'].falsePositiveRate).toBe(0.0);
      });
    });

    describe('パフォーマンス分析の信頼性', () => {
      it('分析時間の統計を正確に計算する', async () => {
        // Arrange
        const performanceData = [
          { file: 'test1.ts', analysisTime: 100 },
          { file: 'test2.ts', analysisTime: 200 },
          { file: 'test3.ts', analysisTime: 150 }
        ];

        // Act
        for (const data of performanceData) {
          await system.recordPerformance(data);
        }
        const stats = await system.getPerformanceStats();

        // Assert
        expect(stats.averageTime).toBe(150);
        expect(stats.minTime).toBe(100);
        expect(stats.maxTime).toBe(200);
        expect(stats.totalFiles).toBe(3);
      });

      it('遅いファイルを正しく識別する', async () => {
        // Arrange
        const performanceData = [
          { file: 'fast.ts', analysisTime: 50 },
          { file: 'slow1.ts', analysisTime: 500 },
          { file: 'normal.ts', analysisTime: 100 },
          { file: 'slow2.ts', analysisTime: 600 }
        ];
        const threshold = 400;

        // Act
        for (const data of performanceData) {
          await system.recordPerformance(data);
        }
        const slowFiles = await system.identifySlowFiles(threshold);

        // Assert
        expect(slowFiles).toHaveLength(2);
        expect(slowFiles).toContain('slow1.ts');
        expect(slowFiles).toContain('slow2.ts');
      });
    });
  });

  describe('エラー耐性とDefensive Programming', () => {
    describe('不正データへの防御的処理', () => {
      it('不正なフィードバックデータを適切に処理する', async () => {
        // Arrange
        const invalidFeedbacks = [
          null,
          undefined,
          { }, // issueIdなし
          { issueId: '' }, // 空のissueId
          { issueId: 123 } // 不正な型
        ];

        // Act & Assert
        for (const invalid of invalidFeedbacks) {
          await expect(system.recordFeedback(invalid as any))
            .rejects.toThrow('Invalid feedback data');
        }
      });

      it('破損したデータファイルから回復する', async () => {
        // Arrange
        (fs.readFile as jest.Mock).mockResolvedValue('{ invalid json');

        // Act
        await system.loadPersistedFeedback();
        const feedback = await system.getAllFeedback();

        // Assert
        expect(feedback).toEqual([]);
        expect(system.hasCorruptedData()).toBe(true);
      });
    });

    describe('システム障害時のグレースフルデグレード', () => {
      it('ファイルシステム障害時も基本機能を維持する', async () => {
        // Arrange
        (fs.writeFile as jest.Mock).mockRejectedValue(new Error('File system error'));
        (fs.readFile as jest.Mock).mockRejectedValue(new Error('File system error'));

        // Act
        const feedback = { issueId: 'test-001', falsePositive: true };
        await system.recordFeedback(feedback);
        const retrieved = await system.getFeedback('test-001');

        // Assert
        expect(retrieved).toEqual(feedback);
        expect(system.isOperatingInDegradedMode()).toBe(true);
      });

      it('メモリ制限に達した場合、古いデータを適切に削除する', async () => {
        // Arrange
        const maxMemoryItems = 1000;
        system.setMemoryLimit(maxMemoryItems);

        // Act
        for (let i = 0; i < maxMemoryItems + 100; i++) {
          await system.recordFeedback({ 
            issueId: `test-${i}`, 
            timestamp: new Date(2024, 0, i + 1)
          });
        }

        // Assert
        const allFeedback = await system.getAllFeedback();
        expect(allFeedback).toHaveLength(maxMemoryItems);
        // 最も古いデータが削除されていることを確認
        expect(allFeedback.find(f => f.issueId === 'test-0')).toBeUndefined();
      });
    });
  });

  describe('ビジネス価値の提供', () => {
    it('改善提案の優先順位を正しく算出する', async () => {
      // Arrange
      const feedbacks = [
        { issueId: '1', rule: 'rule-a', falsePositive: true, impact: 'high' },
        { issueId: '2', rule: 'rule-a', falsePositive: true, impact: 'high' },
        { issueId: '3', rule: 'rule-b', falsePositive: false, impact: 'low' },
        { issueId: '4', rule: 'rule-c', falsePositive: true, impact: 'medium' }
      ];

      // Act
      for (const feedback of feedbacks) {
        await system.recordFeedback(feedback);
      }
      const recommendations = await system.getImprovementRecommendations();

      // Assert
      expect(recommendations[0].rule).toBe('rule-a'); // 最も問題のあるルール
      expect(recommendations[0].priority).toBe('high');
      expect(recommendations[0].suggestedAction).toContain('disable or adjust');
    });

    it('チームの生産性向上につながる洞察を提供する', async () => {
      // Arrange
      const timeWasted = [
        { issueId: '1', timeSpentInvestigating: 30, wasRealIssue: false },
        { issueId: '2', timeSpentInvestigating: 45, wasRealIssue: false },
        { issueId: '3', timeSpentInvestigating: 15, wasRealIssue: true }
      ];

      // Act
      for (const data of timeWasted) {
        await system.recordTimeImpact(data);
      }
      const insights = await system.getProductivityInsights();

      // Assert
      expect(insights.totalTimeWastedOnFalsePositives).toBe(75); // 30 + 45
      expect(insights.averageTimePerFalsePositive).toBe(37.5);
      expect(insights.potentialTimeSavings).toBeGreaterThan(0);
    });
  });
});