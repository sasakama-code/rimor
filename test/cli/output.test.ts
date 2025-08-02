import { OutputFormatter } from '../../src/cli/output';

describe('OutputFormatter', () => {
  test('header should format title with emoji and line', async () => {
    const result = await OutputFormatter.header('Test Title');
    expect(result).toContain('🔍 Test Title');
    expect(result).toContain('━');
  }, 30000);

  test('success should format with checkmark', async () => {
    const result = await OutputFormatter.success('Task completed');
    expect(result).toContain('✅ Task completed');
  }, 30000);

  test('error should format with cross mark', async () => {
    const result = await OutputFormatter.error('Something went wrong');
    expect(result).toContain('❌ Something went wrong');
  }, 30000);

  test('summary should calculate coverage correctly', async () => {
    const result = await OutputFormatter.summary(10, 3, 150);
    expect(result).toContain('分析対象: 10ファイル');
    expect(result).toContain('テスト不足: 3件');
    expect(result).toContain('テストカバレッジ: 70%');
    expect(result).toContain('実行時間: 150ms');
  }, 30000);

  test('issueList should handle no issues', async () => {
    const result = await OutputFormatter.issueList([]);
    expect(result).toContain('問題は見つかりませんでした！');
  }, 30000);

  test('issueList should format multiple issues', async () => {
    const issues = [
      { severity: 'error', message: 'Error 1' },
      { severity: 'warning', message: 'Warning 1' }
    ];
    const result = await OutputFormatter.issueList(issues);
    expect(result).toContain('1. ❌ Error 1');
    expect(result).toContain('2. ⚠️ Warning 1');
  }, 30000);
});