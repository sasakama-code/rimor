/**
 * code-context から code-analysis への移行テスト
 * TDD RED段階：t_wadaの推奨するテストファースト実装
 */

import * as fs from 'fs';
import * as path from 'path';

describe('Code Context to Code Analysis Migration', () => {
  const analyzersPath = path.join(__dirname, '../../src/analyzers');
  const oldPath = path.join(analyzersPath, 'code-context');
  const newPath = path.join(analyzersPath, 'code-analysis');

  describe('Directory Structure', () => {
    it('新しいcode-analysisディレクトリが存在すること', () => {
      expect(fs.existsSync(newPath)).toBe(true);
    });

    it('code-analysisディレクトリに必要なファイルが存在すること', () => {
      const requiredFiles = [
        'context-extractor.ts',  // core.ts から改名
        'language-parser.ts',    // language.ts から改名
        'scope-analyzer.ts',      // scope.ts から改名
        'file-analyzer.ts',       // file.ts から改名
        'utils.ts'               // そのまま
      ];

      requiredFiles.forEach(file => {
        const filePath = path.join(newPath, file);
        expect(fs.existsSync(filePath)).toBe(true);
      });
    });

    it('古いcode-contextディレクトリが削除されていること', () => {
      // code-contextディレクトリは削除済み
      expect(fs.existsSync(oldPath)).toBe(false);
    });
  });

  describe('Module Exports', () => {
    it('context-extractorが正しくエクスポートされること', async () => {
      const module = await import('../../src/analyzers/code-analysis/context-extractor');
      expect(module.AdvancedCodeContextAnalyzer).toBeDefined();
      expect(typeof module.AdvancedCodeContextAnalyzer).toBe('function');
    });

    it('language-parserが正しくエクスポートされること', async () => {
      const module = await import('../../src/analyzers/code-analysis/language-parser');
      expect(module.LanguageAnalyzer).toBeDefined();
      expect(typeof module.LanguageAnalyzer).toBe('function');
    });

    it('scope-analyzerが正しくエクスポートされること', async () => {
      const module = await import('../../src/analyzers/code-analysis/scope-analyzer');
      expect(module.ScopeAnalyzer).toBeDefined();
      expect(typeof module.ScopeAnalyzer).toBe('function');
    });

    it('file-analyzerが正しくエクスポートされること', async () => {
      const module = await import('../../src/analyzers/code-analysis/file-analyzer');
      expect(module.FileAnalyzer).toBeDefined();
      expect(typeof module.FileAnalyzer).toBe('function');
    });
  });

  describe('Backward Compatibility', () => {
    it('code-context.tsファサードが後方互換性を維持すること', async () => {
      const module = await import('../../src/analyzers/code-context');
      expect(module.CodeContextAnalyzer).toBeDefined();
      expect(typeof module.CodeContextAnalyzer).toBe('function');
    });

    it('CodeContextAnalyzerが新しいモジュールを正しく使用すること', async () => {
      const { CodeContextAnalyzer } = await import('../../src/analyzers/code-context');
      const analyzer = new CodeContextAnalyzer();
      
      // 各メソッドが定義されていることを確認
      expect(analyzer.analyzeCodeContext).toBeDefined();
      expect(analyzer.extractFunctionInfo).toBeDefined();
      expect(analyzer.analyzeScopeHierarchy).toBeDefined();
      expect(analyzer.findRelatedFiles).toBeDefined();
    });

    it('既存のテストが新しい構造でも動作すること', async () => {
      // 既存のテストファイルが新しいパスで動作することを確認
      const testFiles = [
        'context-extractor.test.ts',
        'language-parser.test.ts',
        'scope-analyzer.test.ts',
        'file-analyzer.test.ts'
      ];

      const testPath = path.join(__dirname, 'code-analysis');
      testFiles.forEach(file => {
        const filePath = path.join(testPath, file);
        expect(fs.existsSync(filePath)).toBe(true);
      });
    });
  });

  describe('Naming Convention', () => {
    it('モジュール名が責務を明確に表現していること', () => {
      const moduleNames = {
        'context-extractor.ts': 'コンテキスト抽出の責務',
        'language-parser.ts': '言語解析の責務',
        'scope-analyzer.ts': 'スコープ分析の責務',
        'file-analyzer.ts': 'ファイル分析の責務'
      };

      Object.keys(moduleNames).forEach(moduleName => {
        const filePath = path.join(newPath, moduleName);
        expect(fs.existsSync(filePath)).toBe(true);
      });
    });
  });

  describe('Import Path Updates', () => {
    it('code-context.tsのインポートパスが更新されていること', async () => {
      const facadeContent = fs.readFileSync(
        path.join(analyzersPath, 'code-context.ts'),
        'utf-8'
      );

      // 新しいパスを使用していることを確認
      expect(facadeContent).toContain('./code-analysis/context-extractor');
      expect(facadeContent).toContain('./code-analysis/language-parser');
      expect(facadeContent).toContain('./code-analysis/scope-analyzer');
      expect(facadeContent).toContain('./code-analysis/file-analyzer');

      // 古いパスを使用していないことを確認
      expect(facadeContent).not.toContain('./code-context/core');
      expect(facadeContent).not.toContain('./code-context/language');
      expect(facadeContent).not.toContain('./code-context/scope');
      expect(facadeContent).not.toContain('./code-context/file');
    });
  });
});

describe('Code Analysis Module Responsibilities', () => {
  describe('Context Extractor', () => {
    it('コード文脈の抽出に専念していること', async () => {
      const { AdvancedCodeContextAnalyzer } = await import(
        '../../src/analyzers/code-analysis/context-extractor'
      );
      const analyzer = new AdvancedCodeContextAnalyzer();
      
      expect(analyzer.analyzeCodeContext).toBeDefined();
      expect(analyzer.extractCodeContext).toBeDefined();
    });
  });

  describe('Language Parser', () => {
    it('言語固有の解析に専念していること', async () => {
      const { LanguageAnalyzer } = await import(
        '../../src/analyzers/code-analysis/language-parser'
      );
      const analyzer = new LanguageAnalyzer();
      
      expect(analyzer.extractFunctionInfo).toBeDefined();
      expect(analyzer.detectLanguage).toBeDefined();
      expect(analyzer.parseLanguageSpecificFeatures).toBeDefined();
    });
  });

  describe('Scope Analyzer', () => {
    it('スコープ階層の分析に専念していること', async () => {
      const { ScopeAnalyzer } = await import(
        '../../src/analyzers/code-analysis/scope-analyzer'
      );
      const analyzer = new ScopeAnalyzer();
      
      expect(analyzer.analyzeScopeHierarchy).toBeDefined();
      expect(analyzer.extractScopes).toBeDefined();
    });
  });

  describe('File Analyzer', () => {
    it('ファイル関連の分析に専念していること', async () => {
      const { FileAnalyzer } = await import(
        '../../src/analyzers/code-analysis/file-analyzer'
      );
      const analyzer = new FileAnalyzer();
      
      expect(analyzer.findRelatedFiles).toBeDefined();
      expect(analyzer.analyzeFileStructure).toBeDefined();
    });
  });
});