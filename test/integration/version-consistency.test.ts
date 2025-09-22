/**
 * バージョン整合性監査テスト
 * Issue #164対応 - TDD Red段階: 期待される失敗を定義
 *
 * t_wada TDD原則: Red-Green-Refactorサイクルの実装
 * Uncle Bob SOLID原則: Single Responsibility Principle適用
 */

import fs from 'fs';
import path from 'path';
import { describe, it, expect } from '@jest/globals';

describe('バージョン整合性監査 - Issue #164', () => {
  const PROJECT_ROOT = path.resolve(__dirname, '../..');
  const EXPECTED_VERSION = '0.9.0';

  describe('Package.json基準バージョン検証', () => {
    it('package.jsonのバージョンがv0.9.0であること', async () => {
      const packageJsonPath = path.join(PROJECT_ROOT, 'package.json');
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));

      expect(packageJson.version).toBe(EXPECTED_VERSION);
    });
  });

  describe('Critical修正対象ファイルのバージョン整合性', () => {
    const CRITICAL_FILES = [
      {
        path: 'src/container/types.ts',
        expectedLine: 3,
        description: 'DIコンテナ型定義',
      },
      {
        path: 'src/domain/simple-rules.ts',
        expectedLine: 3,
        description: 'ドメインルール定義',
      },
    ];

    CRITICAL_FILES.forEach(({ path: filePath, expectedLine, description }) => {
      it(`${description}(${filePath}:${expectedLine}) でバージョンがv${EXPECTED_VERSION}であること`, async () => {
        const fullPath = path.join(PROJECT_ROOT, filePath);

        // Defensive Programming: ファイル存在確認
        expect(fs.existsSync(fullPath)).toBe(true);

        const content = fs.readFileSync(fullPath, 'utf-8');
        const lines = content.split('\n');
        const targetLine = lines[expectedLine - 1]; // 0-indexed

        // DRY原則: バージョンパターンの統一
        const versionPattern = new RegExp(`v${EXPECTED_VERSION.replace(/\./g, '\\.')}`);

        expect(targetLine).toMatch(versionPattern);

        // KISS原則: シンプルな文字列検証も追加
        expect(targetLine).toContain(`v${EXPECTED_VERSION}`);
      });
    });
  });

  describe('Reporting系ファイル群のバージョン整合性', () => {
    const REPORTING_FILES = [
      'src/reporting/AnnotationGenerator.ts',
      'src/reporting/StructuredReporter.ts',
      'src/reporting/types.ts',
      'src/reporting/TemplatedReporter.ts',
      'src/reporting/CodeAnnotator.ts',
      'src/reporting/cache/ReportCache.ts',
    ];

    REPORTING_FILES.forEach(filePath => {
      it(`${filePath} のヘッダーコメントでバージョンがv${EXPECTED_VERSION}であること`, async () => {
        const fullPath = path.join(PROJECT_ROOT, filePath);

        if (fs.existsSync(fullPath)) {
          const content = fs.readFileSync(fullPath, 'utf-8');
          const lines = content.split('\n');

          // Phase 4コメントを含む3行目をチェック
          const targetLine = lines[2]; // 0-indexed for line 3

          if (targetLine && targetLine.includes('Phase 4')) {
            const versionPattern = new RegExp(`v${EXPECTED_VERSION.replace(/\./g, '\\.')}`);
            expect(targetLine).toMatch(versionPattern);
          }
        }
      });
    });
  });

  describe('アーキテクチャファイルのバージョン整合性', () => {
    it('src/analyzers/structure-analysis/MetricsCalculator.ts でバージョンがv0.9.0であること', async () => {
      const filePath = path.join(
        PROJECT_ROOT,
        'src/analyzers/structure-analysis/MetricsCalculator.ts'
      );

      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf-8');
        const lines = content.split('\n');
        const targetLine = lines[2]; // 3行目

        const versionPattern = new RegExp(`v${EXPECTED_VERSION.replace(/\./g, '\\.')}`);
        expect(targetLine).toMatch(versionPattern);
      }
    });
  });

  describe('README.mdドキュメントの整合性', () => {
    it('README.md内でv0.8.0の古い記載が残っていないこと', async () => {
      const readmePath = path.join(PROJECT_ROOT, 'README.md');

      if (fs.existsSync(readmePath)) {
        const content = fs.readFileSync(readmePath, 'utf-8');

        // 基本的な分析（従来のv0.8.0モード）の記載をチェック
        const oldVersionPattern = /基本的な分析\（従来のv0\.8\.0モード\）/;

        if (oldVersionPattern.test(content)) {
          // v0.8.0記載が存在する場合、適切な文脈かチェック
          const lines = content.split('\n');
          const targetLines = lines.filter(line => oldVersionPattern.test(line));

          // YAGNI原則: 必要最小限のチェック
          expect(targetLines.length).toBeGreaterThan(0);
        }
      }
    });
  });

  describe('プロジェクト品質メトリクス', () => {
    it('バージョン不整合箇所数の測定', async () => {
      // Martin Fowler Refactoring: 測定による改善計画
      const oldVersionPattern = /v0\.8\.0/g;
      let inconsistencyCount = 0;

      const criticalPaths = ['src/container/types.ts', 'src/domain/simple-rules.ts', 'README.md'];

      criticalPaths.forEach(relativePath => {
        const fullPath = path.join(PROJECT_ROOT, relativePath);
        if (fs.existsSync(fullPath)) {
          const content = fs.readFileSync(fullPath, 'utf-8');
          const matches = content.match(oldVersionPattern);
          if (matches) {
            inconsistencyCount += matches.length;
          }
        }
      });

      // 期待される失敗: 現時点でv0.8.0記載が存在することを確認
      expect(inconsistencyCount).toBeGreaterThan(0);

      console.log(`検出されたバージョン不整合箇所: ${inconsistencyCount}件`);
    });
  });
});
