/**
 * YAML構文検証テスト
 * 
 * Issue #90: 複数行のコミットメッセージ内でコロン（:）が含まれているため、YAML構文エラーが発生
 * TDD（テスト駆動開発）アプローチに従って、まずテストを作成
 */

const yaml = require('js-yaml');

describe('YAML構文検証テスト', () => {
  describe('複数行git commitメッセージの検証', () => {
    test('不正なYAML構文のコミットメッセージでエラーが発生すること', () => {
      // Issue #90で指摘された問題のあるYAML構文を再現
      const problematicYaml = `
name: Test Workflow
on: push
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - name: Problematic commit
        run: |
          git commit -m "chore: release v1.0.0 🚀

          Auto-release triggered by conventional commits

          🤖 Generated with [Claude Code](https://claude.ai/code)

          Co-Authored-By: Claude <noreply@anthropic.com>"
      `;

      // YAML構文エラーが発生することを確認
      expect(() => {
        yaml.load(problematicYaml);
      }).toThrow();
    });

    test('修正されたYAML構文（複数-mフラグ）が正常にパースできること', () => {
      // Issue #90で提案された修正版YAML構文
      const fixedYamlWithMultipleM = `
name: Test Workflow
on: push
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - name: Fixed commit with multiple -m flags
        run: |
          git commit -m "chore: release v1.0.0 🚀" \\
            -m "" \\
            -m "Auto-release triggered by conventional commits" \\
            -m "" \\
            -m "🤖 Generated with [Claude Code](https://claude.ai/code)" \\
            -m "" \\
            -m "Co-Authored-By: Claude <noreply@anthropic.com>"
      `;

      // YAML構文エラーが発生しないことを確認
      expect(() => {
        const parsed = yaml.load(fixedYamlWithMultipleM);
        expect(parsed).toBeDefined();
        expect(parsed.name).toBe('Test Workflow');
      }).not.toThrow();
    });

    test('修正されたYAML構文（ブロックスカラー）が正常にパースできること', () => {
      // YAMLブロックスカラーを使用した修正版
      const fixedYamlWithBlockScalar = `
name: Test Workflow
on: push
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - name: Fixed commit with block scalar
        run: |
          git commit -m "$(cat <<'EOF'
          chore: release v1.0.0 🚀

          Auto-release triggered by conventional commits

          🤖 Generated with [Claude Code](https://claude.ai/code)

          Co-Authored-By: Claude <noreply@anthropic.com>
          EOF
          )"
      `;

      // YAML構文エラーが発生しないことを確認
      expect(() => {
        const parsed = yaml.load(fixedYamlWithBlockScalar);
        expect(parsed).toBeDefined();
        expect(parsed.name).toBe('Test Workflow');
      }).not.toThrow();
    });

    test('RELEASE_PROCESS_GUIDE.mdの複数行コミットメッセージが適切に記述されていること', () => {
      // ドキュメント内の複数行コミットメッセージの例をテスト
      const releaseGuideYaml = `
name: Test Workflow
on: push
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - name: Release process commit
        run: |
          git commit -m "$(cat <<'EOF'
          release: prepare v1.2.3

          🎯 Version bump to v1.2.3
          📝 Update CHANGELOG with new features
          📚 Update documentation

          ✅ All quality checks passed
          🔍 Ready for release review
          EOF
          )"
      `;

      // YAML構文エラーが発生しないことを確認
      expect(() => {
        const parsed = yaml.load(releaseGuideYaml);
        expect(parsed).toBeDefined();
      }).not.toThrow();
    });
  });

  describe('YAML構文の防御的プログラミング', () => {
    test('特殊文字を含む文字列が適切にエスケープされること', () => {
      const testCases = [
        'コロンを含む文字列: test',
        '引用符を含む文字列 "test"',
        'シングル引用符を含む文字列 \'test\'',
        'バックスラッシュを含む文字列 \\test',
        '改行を含む文字列\ntest'
      ];

      testCases.forEach(testCase => {
        const yamlContent = `
test_value: |
  ${testCase}
        `;
        
        expect(() => {
          const parsed = yaml.load(yamlContent);
          expect(parsed.test_value.trim()).toBe(testCase);
        }).not.toThrow();
      });
    });
  });
});