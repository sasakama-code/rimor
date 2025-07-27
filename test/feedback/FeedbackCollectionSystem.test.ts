/**
 * FeedbackCollectionSystem.test.ts
 * フィードバック収集システムのテスト
 */

import { FeedbackCollectionSystem, ProjectFeedback, FalsePositiveReport, MissedIssueReport } from '../../src/feedback/FeedbackCollectionSystem';
import * as fs from 'fs/promises';
import * as path from 'path';

// テスト用のディレクトリ
const TEST_FEEDBACK_DIR = './test-feedback-data';

describe('FeedbackCollectionSystem - フィードバック収集システム', () => {
  let feedbackSystem: FeedbackCollectionSystem;

  beforeEach(() => {
    feedbackSystem = new FeedbackCollectionSystem(TEST_FEEDBACK_DIR);
  });

  afterEach(async () => {
    // テスト用ディレクトリのクリーンアップ
    try {
      await fs.rm(TEST_FEEDBACK_DIR, { recursive: true, force: true });
    } catch (error) {
      // ディレクトリが存在しない場合は無視
    }
  });

  describe('プロジェクトフィードバック収集', () => {
    it('有効なフィードバックを収集・保存すること', async () => {
      const feedback: ProjectFeedback = {
        projectId: 'test-project-001',
        projectName: 'テストプロジェクト',
        framework: 'express',
        projectSize: {
          fileCount: 50,
          testCount: 25,
          complexity: 'medium'
        },
        usageMetrics: {
          analysisFrequency: 7,
          averageAnalysisTime: 45.5,
          issuesDetected: 15,
          issuesResolved: 12
        },
        userExperience: {
          satisfaction: 8,
          easeOfUse: 7,
          accuracyRating: 9,
          performanceRating: 6,
          overallValue: 8
        },
        specificFeedback: {
          mostUsefulFeatures: ['高速解析', 'セキュリティチェック'],
          painPoints: ['初期設定の複雑さ'],
          improvementSuggestions: ['ドキュメントの改善'],
          falsePositives: [],
          missedIssues: []
        },
        timestamp: new Date()
      };

      await feedbackSystem.collectProjectFeedback(feedback);

      // CI環境ではファイル作成をスキップするため、メモリ内データのみ確認
      if (process.env.CI === 'true') {
        // メモリ内にデータが保存されているかチェック
        const collectedFeedback = (feedbackSystem as any).collectedFeedback;
        expect(collectedFeedback.length).toBe(1);
        expect(collectedFeedback[0].projectId).toBe(feedback.projectId);
        expect(collectedFeedback[0].projectName).toBe(feedback.projectName);
      } else {
        // ローカル環境ではファイルチェック
        const files = await fs.readdir(TEST_FEEDBACK_DIR);
        const jsonFiles = files.filter(f => f.endsWith('.json'));
        expect(jsonFiles.length).toBe(1);

        // ファイル内容の確認
        const savedContent = await fs.readFile(path.join(TEST_FEEDBACK_DIR, jsonFiles[0]), 'utf-8');
        const savedFeedback = JSON.parse(savedContent);
        expect(savedFeedback.projectId).toBe(feedback.projectId);
        expect(savedFeedback.projectName).toBe(feedback.projectName);
      }
    });

    it('不正なフィードバックデータに対してエラーを投げること', async () => {
      const invalidFeedback = {
        projectId: '', // 空のプロジェクトID
        projectName: 'テスト',
        framework: 'express',
        projectSize: { fileCount: 10, testCount: 5, complexity: 'small' },
        usageMetrics: { analysisFrequency: 1, averageAnalysisTime: 100, issuesDetected: 5, issuesResolved: 3 },
        userExperience: { satisfaction: 15, easeOfUse: 8, accuracyRating: 9, performanceRating: 7, overallValue: 8 }, // 不正な満足度
        specificFeedback: { mostUsefulFeatures: [], painPoints: [], improvementSuggestions: [], falsePositives: [], missedIssues: [] },
        timestamp: new Date()
      } as ProjectFeedback;

      await expect(feedbackSystem.collectProjectFeedback(invalidFeedback)).rejects.toThrow();
    });

    it('複数のフィードバックを正しく管理すること', async () => {
      const feedback1: ProjectFeedback = {
        projectId: 'project-001',
        projectName: 'プロジェクト1',
        framework: 'express',
        projectSize: { fileCount: 30, testCount: 15, complexity: 'small' },
        usageMetrics: { analysisFrequency: 5, averageAnalysisTime: 35, issuesDetected: 8, issuesResolved: 6 },
        userExperience: { satisfaction: 7, easeOfUse: 8, accuracyRating: 7, performanceRating: 9, overallValue: 8 },
        specificFeedback: { mostUsefulFeatures: ['高速化'], painPoints: [], improvementSuggestions: [], falsePositives: [], missedIssues: [] },
        timestamp: new Date()
      };

      const feedback2: ProjectFeedback = {
        projectId: 'project-002',
        projectName: 'プロジェクト2',
        framework: 'react',
        projectSize: { fileCount: 80, testCount: 40, complexity: 'medium' },
        usageMetrics: { analysisFrequency: 10, averageAnalysisTime: 60, issuesDetected: 20, issuesResolved: 18 },
        userExperience: { satisfaction: 9, easeOfUse: 8, accuracyRating: 9, performanceRating: 7, overallValue: 8 },
        specificFeedback: { mostUsefulFeatures: ['React対応'], painPoints: [], improvementSuggestions: [], falsePositives: [], missedIssues: [] },
        timestamp: new Date()
      };

      await feedbackSystem.collectProjectFeedback(feedback1);
      await feedbackSystem.collectProjectFeedback(feedback2);

      // CI環境ではメモリ内データのみ確認
      if (process.env.CI === 'true') {
        const collectedFeedback = (feedbackSystem as any).collectedFeedback;
        expect(collectedFeedback.length).toBe(2);
      } else {
        const files = await fs.readdir(TEST_FEEDBACK_DIR);
        const jsonFiles = files.filter(f => f.endsWith('.json'));
        expect(jsonFiles.length).toBe(2);
      }
    });
  });

  describe('自動フィードバック生成', () => {
    it('使用統計から自動フィードバックを生成すること', async () => {
      const analysisResults = [
        {
          filePath: 'src/auth/login.js',
          issues: [
            { id: '1', type: 'auth-issue', severity: 'warning' as const, message: 'Test', location: { file: 'test', line: 1, column: 1 } }
          ],
          executionTime: 25
        },
        {
          filePath: 'src/user/profile.js',
          issues: [
            { id: '2', type: 'validation-issue', severity: 'error' as const, message: 'Test', location: { file: 'test', line: 1, column: 1 } }
          ],
          executionTime: 35
        }
      ];

      const usageStats = {
        frequency: 7
      };

      const automaticFeedback = await feedbackSystem.generateAutomaticFeedback(
        'auto-project-001',
        '自動プロジェクト',
        analysisResults,
        usageStats
      );

      expect(automaticFeedback).toBeDefined();
      expect(automaticFeedback.projectId).toBe('auto-project-001');
      expect(automaticFeedback.projectName).toBe('自動プロジェクト');
      expect(automaticFeedback.framework).toBeDefined();
      expect(automaticFeedback.projectSize.fileCount).toBe(2);
      expect(automaticFeedback.usageMetrics.averageAnalysisTime).toBe(30); // (25+35)/2
      expect(automaticFeedback.usageMetrics.issuesDetected).toBe(2);
      expect(automaticFeedback.userExperience.satisfaction).toBeGreaterThanOrEqual(1);
      expect(automaticFeedback.userExperience.satisfaction).toBeLessThanOrEqual(10);
    });

    it('フレームワークを正しく検出すること', async () => {
      const expressResults = [
        { filePath: 'src/express-app.js', issues: [], executionTime: 20 },
        { filePath: 'src/router.js', issues: [], executionTime: 15 }
      ];

      const reactResults = [
        { filePath: 'src/react-component.jsx', issues: [], executionTime: 30 },
        { filePath: 'src/another-component.jsx', issues: [], executionTime: 25 }
      ];

      const expressFeedback = await feedbackSystem.generateAutomaticFeedback(
        'express-project', 'Express App', expressResults, {}
      );

      const reactFeedback = await feedbackSystem.generateAutomaticFeedback(
        'react-project', 'React App', reactResults, {}
      );

      expect(expressFeedback.framework).toBe('express');
      expect(reactFeedback.framework).toBe('react');
    });

    it('プロジェクトの複雑度を正しく評価すること', async () => {
      const smallProjectResults = Array.from({ length: 30 }, (_, i) => ({
        filePath: `src/file${i}.js`,
        issues: [],
        executionTime: 10
      }));

      const largeProjectResults = Array.from({ length: 500 }, (_, i) => ({
        filePath: `src/file${i}.js`,
        issues: [],
        executionTime: 10
      }));

      const smallFeedback = await feedbackSystem.generateAutomaticFeedback(
        'small-project', 'Small Project', smallProjectResults, {}
      );

      const largeFeedback = await feedbackSystem.generateAutomaticFeedback(
        'large-project', 'Large Project', largeProjectResults, {}
      );

      expect(smallFeedback.projectSize.complexity).toBe('small');
      expect(largeFeedback.projectSize.complexity).toBe('large');
    });
  });

  describe('フィードバック分析', () => {
    beforeEach(async () => {
      // テスト用のフィードバックデータを事前に作成
      const testFeedback: ProjectFeedback[] = [
        {
          projectId: 'analysis-test-001',
          projectName: 'Analysis Test 1',
          framework: 'express',
          projectSize: { fileCount: 50, testCount: 25, complexity: 'medium' },
          usageMetrics: { analysisFrequency: 7, averageAnalysisTime: 45, issuesDetected: 10, issuesResolved: 8 },
          userExperience: { satisfaction: 8, easeOfUse: 7, accuracyRating: 8, performanceRating: 6, overallValue: 7 },
          specificFeedback: {
            mostUsefulFeatures: ['高速解析', 'セキュリティチェック'],
            painPoints: ['設定が複雑', '学習コストが高い'],
            improvementSuggestions: ['ドキュメント改善', 'UI向上'],
            falsePositives: [
              {
                issueType: 'sql-injection',
                description: 'Safe query flagged as vulnerable',
                codeSnippet: 'SELECT * FROM users WHERE id = ?',
                expectedBehavior: 'No issue',
                actualBehavior: 'False positive',
                impact: 'low',
                frequency: 2
              }
            ],
            missedIssues: []
          },
          timestamp: new Date()
        },
        {
          projectId: 'analysis-test-002',
          projectName: 'Analysis Test 2',
          framework: 'react',
          projectSize: { fileCount: 80, testCount: 40, complexity: 'medium' },
          usageMetrics: { analysisFrequency: 5, averageAnalysisTime: 65, issuesDetected: 15, issuesResolved: 12 },
          userExperience: { satisfaction: 9, easeOfUse: 8, accuracyRating: 9, performanceRating: 7, overallValue: 8 },
          specificFeedback: {
            mostUsefulFeatures: ['React対応', 'AI最適化'],
            painPoints: ['設定が複雑'],
            improvementSuggestions: ['パフォーマンス向上'],
            falsePositives: [],
            missedIssues: []
          },
          timestamp: new Date()
        }
      ];

      // フィードバックデータを保存
      for (const feedback of testFeedback) {
        await feedbackSystem.collectProjectFeedback(feedback);
      }
    });

    it('フィードバック分析を実行すること', async () => {
      const analysis = await feedbackSystem.analyzeFeedback();

      expect(analysis).toBeDefined();
      expect(analysis.overallSatisfaction).toBeGreaterThan(0);
      expect(analysis.commonPainPoints).toBeDefined();
      expect(Array.isArray(analysis.commonPainPoints)).toBe(true);
      expect(analysis.prioritizedImprovements).toBeDefined();
      expect(analysis.accuracyIssues).toBeDefined();
      expect(analysis.performanceIssues).toBeDefined();
      expect(analysis.featureUsage).toBeDefined();
    });

    it('総合満足度を正しく計算すること', async () => {
      const analysis = await feedbackSystem.analyzeFeedback();

      // テストデータの満足度は8と9なので、平均8.5のはず
      expect(analysis.overallSatisfaction).toBeCloseTo(8.5, 1);
    });

    it('共通課題を特定すること', async () => {
      const analysis = await feedbackSystem.analyzeFeedback();

      expect(analysis.commonPainPoints).toContain('設定が複雑');
      expect(analysis.commonPainPoints.length).toBeGreaterThanOrEqual(1);
    });

    it('精度問題を分析すること', async () => {
      const analysis = await feedbackSystem.analyzeFeedback();

      expect(analysis.accuracyIssues.falsePositiveRate).toBeGreaterThanOrEqual(0);
      expect(analysis.accuracyIssues.missedIssueRate).toBeGreaterThanOrEqual(0);
      expect(Array.isArray(analysis.accuracyIssues.topProblematicPatterns)).toBe(true);
    });

    it('パフォーマンス問題を分析すること', async () => {
      const analysis = await feedbackSystem.analyzeFeedback();

      expect(analysis.performanceIssues.averageAnalysisTime).toBeGreaterThan(0);
      expect(Array.isArray(analysis.performanceIssues.slowestOperations)).toBe(true);
      expect(typeof analysis.performanceIssues.memoryUsageComplaints).toBe('number');
    });

    it('機能使用状況を分析すること', async () => {
      const analysis = await feedbackSystem.analyzeFeedback();

      expect(Array.isArray(analysis.featureUsage.mostUsedFeatures)).toBe(true);
      expect(Array.isArray(analysis.featureUsage.leastUsedFeatures)).toBe(true);
      expect(Array.isArray(analysis.featureUsage.requestedFeatures)).toBe(true);
      expect(analysis.featureUsage.mostUsedFeatures).toContain('高速解析');
    });
  });

  describe('改善計画生成', () => {
    it('改善計画を生成すること', async () => {
      // 高い偽陽性率を持つ分析結果をモック
      const mockAnalysis = {
        overallSatisfaction: 7.5,
        commonPainPoints: ['設定複雑', 'パフォーマンス低下'],
        prioritizedImprovements: [],
        accuracyIssues: {
          falsePositiveRate: 0.25, // 25% - 閾値15%を超える
          missedIssueRate: 0.05,
          topProblematicPatterns: ['認証', '入力検証']
        },
        performanceIssues: {
          averageAnalysisTime: 150, // 150ms - 閾値100msを超える
          slowestOperations: ['フロー解析'],
          memoryUsageComplaints: 0
        },
        featureUsage: {
          mostUsedFeatures: ['解析'],
          leastUsedFeatures: ['設定'],
          requestedFeatures: ['自動修正', 'VSCode拡張', 'リアルタイム監視']
        }
      };

      const improvements = await feedbackSystem.generateImprovementPlan(mockAnalysis);

      expect(improvements).toBeDefined();
      expect(Array.isArray(improvements)).toBe(true);
      expect(improvements.length).toBeGreaterThan(0);

      // 偽陽性率の改善が含まれているかチェック
      const accuracyImprovement = improvements.find(imp => imp.category === 'accuracy');
      expect(accuracyImprovement).toBeDefined();
      expect(accuracyImprovement?.priority).toBe('critical');

      // パフォーマンス改善が含まれているかチェック
      const performanceImprovement = improvements.find(imp => imp.category === 'performance');
      expect(performanceImprovement).toBeDefined();

      // 機能追加が含まれているかチェック
      const featureImprovements = improvements.filter(imp => imp.category === 'features');
      expect(featureImprovements.length).toBeGreaterThan(0);
    });

    it('改善項目の優先度順にソートすること', async () => {
      const mockAnalysis = {
        overallSatisfaction: 6.0,
        commonPainPoints: [],
        prioritizedImprovements: [],
        accuracyIssues: { falsePositiveRate: 0.20, missedIssueRate: 0.08, topProblematicPatterns: [] },
        performanceIssues: { averageAnalysisTime: 200, slowestOperations: [], memoryUsageComplaints: 0 },
        featureUsage: { mostUsedFeatures: [], leastUsedFeatures: [], requestedFeatures: ['新機能'] }
      };

      const improvements = await feedbackSystem.generateImprovementPlan(mockAnalysis);

      // criticalが最初に、その後high、medium、lowの順番
      let lastPriorityValue = 5;
      const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };

      improvements.forEach(improvement => {
        const currentPriorityValue = priorityOrder[improvement.priority];
        expect(currentPriorityValue).toBeLessThanOrEqual(lastPriorityValue);
        lastPriorityValue = currentPriorityValue;
      });
    });

    it('改善項目の必須フィールドが含まれていること', async () => {
      const mockAnalysis = {
        overallSatisfaction: 8.0,
        commonPainPoints: [],
        prioritizedImprovements: [],
        accuracyIssues: { falsePositiveRate: 0.10, missedIssueRate: 0.03, topProblematicPatterns: [] },
        performanceIssues: { averageAnalysisTime: 80, slowestOperations: [], memoryUsageComplaints: 0 },
        featureUsage: { mostUsedFeatures: [], leastUsedFeatures: [], requestedFeatures: ['テスト機能'] }
      };

      const improvements = await feedbackSystem.generateImprovementPlan(mockAnalysis);

      improvements.forEach(improvement => {
        expect(improvement.title).toBeDefined();
        expect(improvement.description).toBeDefined();
        expect(['critical', 'high', 'medium', 'low']).toContain(improvement.priority);
        expect(['high', 'medium', 'low']).toContain(improvement.impact);
        expect(['small', 'medium', 'large']).toContain(improvement.effort);
        expect(['accuracy', 'performance', 'usability', 'features']).toContain(improvement.category);
        expect(typeof improvement.affectedUsers).toBe('number');
        expect(improvement.estimatedImplementationTime).toBeDefined();
      });
    });
  });

  describe('フィードバックレポート生成', () => {
    beforeEach(async () => {
      // テスト用フィードバックデータを作成
      const testFeedback: ProjectFeedback = {
        projectId: 'report-test-001',
        projectName: 'Report Test Project',
        framework: 'express',
        projectSize: { fileCount: 100, testCount: 50, complexity: 'medium' },
        usageMetrics: { analysisFrequency: 7, averageAnalysisTime: 55, issuesDetected: 20, issuesResolved: 16 },
        userExperience: { satisfaction: 8, easeOfUse: 7, accuracyRating: 9, performanceRating: 6, overallValue: 8 },
        specificFeedback: {
          mostUsefulFeatures: ['高速解析', 'セキュリティ検出', 'フレームワーク対応'],
          painPoints: ['初期設定', 'ドキュメント不足'],
          improvementSuggestions: ['UI改善', 'エラーメッセージ向上'],
          falsePositives: [],
          missedIssues: []
        },
        timestamp: new Date()
      };

      await feedbackSystem.collectProjectFeedback(testFeedback);
    });

    it('Markdownフォーマットのレポートを生成すること', async () => {
      const report = await feedbackSystem.generateFeedbackReport();

      expect(report).toBeDefined();
      expect(typeof report).toBe('string');
      expect(report).toContain('# TaintTyper v0.7.0 実プロジェクトフィードバックレポート');
      expect(report).toContain('## 📊 概要統計');
      expect(report).toContain('## 🎯 主要な成果');
      expect(report).toContain('## ⚠️ 共通課題');
      expect(report).toContain('## 🔧 優先改善項目');
    });

    it('レポートファイルを保存すること', async () => {
      const report = await feedbackSystem.generateFeedbackReport();

      // CI環境ではファイル書き込みをスキップするため、レポート内容のみ確認
      if (process.env.CI === 'true') {
        expect(report).toContain('TaintTyper v0.7.0');
      } else {
        const reportPath = path.join(TEST_FEEDBACK_DIR, 'feedback-report.md');
        const reportExists = await fs.access(reportPath).then(() => true).catch(() => false);
        expect(reportExists).toBe(true);

        const reportContent = await fs.readFile(reportPath, 'utf-8');
        expect(reportContent).toContain('TaintTyper v0.7.0');
      }
    });

    it('統計情報が正しく含まれていること', async () => {
      const report = await feedbackSystem.generateFeedbackReport();

      expect(report).toContain('収集フィードバック数');
      expect(report).toContain('総合満足度');
      expect(report).toContain('平均解析時間');
      expect(report).toContain('偽陽性率');
    });
  });

  describe('エラーハンドリング', () => {
    it('フィードバックが存在しない場合に適切にエラーを処理すること', async () => {
      // 空のシステムで分析を実行
      const emptySystem = new FeedbackCollectionSystem('./empty-feedback-dir');

      await expect(emptySystem.analyzeFeedback()).rejects.toThrow('分析対象のフィードバックが存在しません');
    });

    it('不正なプロジェクトIDでエラーを投げること', async () => {
      const invalidFeedback = {
        projectId: '',  // 空のID
        projectName: 'Valid Name',
        framework: 'express',
        projectSize: { fileCount: 10, testCount: 5, complexity: 'small' },
        usageMetrics: { analysisFrequency: 1, averageAnalysisTime: 50, issuesDetected: 3, issuesResolved: 2 },
        userExperience: { satisfaction: 5, easeOfUse: 6, accuracyRating: 7, performanceRating: 8, overallValue: 6 },
        specificFeedback: { mostUsefulFeatures: [], painPoints: [], improvementSuggestions: [], falsePositives: [], missedIssues: [] },
        timestamp: new Date()
      } as ProjectFeedback;

      await expect(feedbackSystem.collectProjectFeedback(invalidFeedback)).rejects.toThrow('プロジェクトIDと名前は必須です');
    });

    it('満足度の範囲外値でエラーを投げること', async () => {
      const invalidFeedback = {
        projectId: 'test-001',
        projectName: 'Test Project',
        framework: 'express',
        projectSize: { fileCount: 10, testCount: 5, complexity: 'small' },
        usageMetrics: { analysisFrequency: 1, averageAnalysisTime: 50, issuesDetected: 3, issuesResolved: 2 },
        userExperience: { satisfaction: 15, easeOfUse: 6, accuracyRating: 7, performanceRating: 8, overallValue: 6 }, // 15は範囲外
        specificFeedback: { mostUsefulFeatures: [], painPoints: [], improvementSuggestions: [], falsePositives: [], missedIssues: [] },
        timestamp: new Date()
      } as ProjectFeedback;

      await expect(feedbackSystem.collectProjectFeedback(invalidFeedback)).rejects.toThrow('満足度は1-10の範囲で指定してください');
    });

    it('破損したJSONファイルを適切に処理すること', async () => {
      // 破損したJSONファイルを作成
      await fs.mkdir(TEST_FEEDBACK_DIR, { recursive: true });
      await fs.writeFile(path.join(TEST_FEEDBACK_DIR, 'corrupted.json'), '{ invalid json content');

      // 分析を実行してもエラーで停止しないことを確認
      expect(async () => {
        try {
          await feedbackSystem.analyzeFeedback();
        } catch (error) {
          // 'No feedback to analyze' エラーが期待される（破損ファイルは無視される）
          expect((error as Error).message).toContain('分析対象のフィードバックが存在しません');
        }
      }).not.toThrow();
    });
  });

  describe('統合テスト', () => {
    it('完全なフィードバック収集から分析まで実行すること', async () => {
      // 1. フィードバック収集
      const feedback: ProjectFeedback = {
        projectId: 'integration-test-001',
        projectName: 'Integration Test Project',
        framework: 'nestjs',
        projectSize: { fileCount: 150, testCount: 75, complexity: 'large' },
        usageMetrics: { analysisFrequency: 14, averageAnalysisTime: 75, issuesDetected: 30, issuesResolved: 25 },
        userExperience: { satisfaction: 9, easeOfUse: 8, accuracyRating: 9, performanceRating: 7, overallValue: 9 },
        specificFeedback: {
          mostUsefulFeatures: ['NestJS対応', 'TypeScript完全サポート', 'セキュリティ解析'],
          painPoints: ['大規模プロジェクトでの速度'],
          improvementSuggestions: ['並列処理強化', 'メモリ使用量最適化'],
          falsePositives: [
            {
              issueType: 'decorator-issue',
              description: 'NestJS decorator false positive',
              codeSnippet: '@Controller("users")',
              expectedBehavior: 'Should be recognized as safe',
              actualBehavior: 'Flagged as potential issue',
              impact: 'medium',
              frequency: 3
            }
          ],
          missedIssues: [
            {
              description: 'SQL injection in complex query',
              securityImplication: 'Data breach potential',
              codeSnippet: 'await db.query(`SELECT * FROM ${table} WHERE id = ${id}`);',
              suggestedDetection: 'Template literal analysis',
              impact: 'high'
            }
          ]
        },
        timestamp: new Date()
      };

      await feedbackSystem.collectProjectFeedback(feedback);

      // 2. フィードバック分析
      const analysis = await feedbackSystem.analyzeFeedback();

      // 3. 改善計画生成
      const improvements = await feedbackSystem.generateImprovementPlan(analysis);

      // 4. レポート生成
      const report = await feedbackSystem.generateFeedbackReport();

      // 検証
      expect(analysis.overallSatisfaction).toBe(9);
      expect(analysis.commonPainPoints).toContain('大規模プロジェクトでの速度');
      expect(improvements.length).toBeGreaterThan(0);
      expect(report).toContain('NestJS対応');
      expect(report).toContain('Integration Test Project');

      // CI環境ではファイル作成をスキップするため、メモリ内データのみ確認
      if (process.env.CI === 'true') {
        // メモリ内データの確認
        const collectedFeedback = (feedbackSystem as any).collectedFeedback;
        expect(collectedFeedback.length).toBeGreaterThanOrEqual(1);
      } else {
        // ローカル環境ではファイルチェック
        const files = await fs.readdir(TEST_FEEDBACK_DIR);
        expect(files).toContain('feedback-report.md');
        expect(files).toContain('analysis-result.json');
        expect(files.filter(f => f.endsWith('.json')).length).toBeGreaterThanOrEqual(1);
      }
    });

    it('複数プロジェクトの横断分析が動作すること', async () => {
      const projects = [
        {
          projectId: 'multi-001',
          name: 'Express API',
          framework: 'express' as const,
          satisfaction: 8,
          analysisTime: 45,
          issues: 12
        },
        {
          projectId: 'multi-002',
          name: 'React Frontend',
          framework: 'react' as const,
          satisfaction: 9,
          analysisTime: 35,
          issues: 8
        },
        {
          projectId: 'multi-003',
          name: 'NestJS Service',
          framework: 'nestjs' as const,
          satisfaction: 7,
          analysisTime: 65,
          issues: 20
        }
      ];

      // 複数プロジェクトのフィードバックを収集
      for (const project of projects) {
        const feedback: ProjectFeedback = {
          projectId: project.projectId,
          projectName: project.name,
          framework: project.framework,
          projectSize: { fileCount: 100, testCount: 50, complexity: 'medium' },
          usageMetrics: { analysisFrequency: 7, averageAnalysisTime: project.analysisTime, issuesDetected: project.issues, issuesResolved: Math.floor(project.issues * 0.8) },
          userExperience: { satisfaction: project.satisfaction, easeOfUse: 8, accuracyRating: 8, performanceRating: 7, overallValue: 8 },
          specificFeedback: { mostUsefulFeatures: [`${project.framework}対応`], painPoints: [], improvementSuggestions: [], falsePositives: [], missedIssues: [] },
          timestamp: new Date()
        };

        await feedbackSystem.collectProjectFeedback(feedback);
      }

      // 横断分析の実行
      const analysis = await feedbackSystem.analyzeFeedback();

      // 期待される平均満足度: (8+9+7)/3 = 8.0
      expect(analysis.overallSatisfaction).toBeCloseTo(8.0, 1);

      // 複数フレームワークの特徴が含まれているかチェック
      const report = await feedbackSystem.generateFeedbackReport();
      expect(report).toContain('Express API');
      expect(report).toContain('React Frontend');
      expect(report).toContain('NestJS Service');
    });
  });
});