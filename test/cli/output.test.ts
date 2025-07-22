import { OutputFormatter } from '../../src/cli/output';
import chalk from 'chalk';

// chalkの色を無効化してテストしやすくする
chalk.level = 0;

describe('OutputFormatter', () => {
  test('header should format title with emoji and line', () => {
    const result = OutputFormatter.header('Test Title');
    expect(result).toContain('🔍 Test Title');
    expect(result).toContain('━');
  });

  test('success should format with checkmark', () => {
    const result = OutputFormatter.success('Task completed');
    expect(result).toContain('✅ Task completed');
  });

  test('error should format with cross mark', () => {
    const result = OutputFormatter.error('Something went wrong');
    expect(result).toContain('❌ Something went wrong');
  });

  test('summary should calculate coverage correctly', () => {
    const result = OutputFormatter.summary(10, 3, 150);
    expect(result).toContain('分析対象: 10ファイル');
    expect(result).toContain('テスト不足: 3件');
    expect(result).toContain('テストカバレッジ: 70%');
    expect(result).toContain('実行時間: 150ms');
  });

  test('issueList should handle no issues', () => {
    const result = OutputFormatter.issueList([]);
    expect(result).toContain('問題は見つかりませんでした！');
  });

  test('issueList should format multiple issues', () => {
    const issues = [
      { severity: 'error', message: 'Error 1' },
      { severity: 'warning', message: 'Warning 1' }
    ];
    const result = OutputFormatter.issueList(issues);
    expect(result).toContain('1. ❌ Error 1');
    expect(result).toContain('2. ⚠️ Warning 1');
  });
});