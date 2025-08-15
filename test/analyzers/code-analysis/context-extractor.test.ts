import { AdvancedCodeContextAnalyzer } from '../../../src/analyzers/code-analysis/context-extractor';
import { Issue } from '../../../src/core/types';
import * as fs from 'fs';
import * as path from 'path';

jest.mock('fs');
jest.mock('../../../src/analyzers/code-analysis/language-parser');
jest.mock('../../../src/analyzers/code-analysis/scope-analyzer');
jest.mock('../../../src/analyzers/code-analysis/file-analyzer');
jest.mock('../../../src/analyzers/code-analysis/utils');
jest.mock('../../../src/utils/pathSecurity');

describe('AdvancedCodeContextAnalyzer', () => {
  let analyzer: AdvancedCodeContextAnalyzer;
  const mockProjectPath = '/test/project';
  const mockIssue: Issue = {
    file: '/test/project/src/app.ts',
    filePath: '/test/project/src/app.ts',
    message: 'Test issue',
    severity: 'medium',
    type: 'test-rule',
    line: 10,
    category: 'test-quality' as const
  };

  beforeEach(() => {
    analyzer = new AdvancedCodeContextAnalyzer();
    jest.clearAllMocks();
    // fs.existsSyncとfs.readFileSyncのみモック
    (fs.existsSync as jest.Mock).mockReturnValue(true);
    (fs.readFileSync as jest.Mock).mockReturnValue('const test = "value";');
    (fs.statSync as jest.Mock).mockReturnValue({ size: 1000 });
    
    // PathSecurityのモック
    const { PathSecurity } = require('../../../src/utils/pathSecurity');
    PathSecurity.safeResolve = jest.fn((filePath) => filePath);
    
    // 各アナライザーのモック設定
    const { LanguageAnalyzer } = require('../../../src/analyzers/code-analysis/language-parser');
    const { ScopeAnalyzer } = require('../../../src/analyzers/code-analysis/scope-analyzer');
    const { FileAnalyzer } = require('../../../src/analyzers/code-analysis/file-analyzer');
    const { CodeContextUtils } = require('../../../src/analyzers/code-analysis/utils');
    
    // LanguageAnalyzerのモック
    LanguageAnalyzer.prototype.detectLanguage = jest.fn().mockReturnValue('typescript');
    LanguageAnalyzer.prototype.extractFunctionInfo = jest.fn().mockResolvedValue([]);
    LanguageAnalyzer.prototype.extractClassInfo = jest.fn().mockReturnValue([]);
    LanguageAnalyzer.prototype.extractInterfaceInfo = jest.fn().mockReturnValue([]);
    LanguageAnalyzer.prototype.extractVariableInfo = jest.fn().mockReturnValue([]);
    LanguageAnalyzer.prototype.extractImports = jest.fn().mockReturnValue([]);
    LanguageAnalyzer.prototype.extractExports = jest.fn().mockReturnValue([]);
    LanguageAnalyzer.prototype.extractUsedAPIs = jest.fn().mockReturnValue([]);
    
    // ScopeAnalyzerのモック
    ScopeAnalyzer.prototype.analyzeScopeContext = jest.fn().mockResolvedValue([]);
    
    // FileAnalyzerのモック
    FileAnalyzer.prototype.findRelatedFiles = jest.fn().mockResolvedValue([]);
    FileAnalyzer.prototype.analyzeDependencies = jest.fn().mockResolvedValue({ dependencies: [], dependents: [] });
    
    // CodeContextUtilsのモック
    CodeContextUtils.prototype.calculateConfidence = jest.fn().mockReturnValue(0.8);
  });

  describe('analyzeCodeContext', () => {
    it('should analyze code context successfully', async () => {
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.readFileSync as jest.Mock).mockReturnValue('const test = "value";');
      
      const result = await analyzer.analyzeCodeContext(mockIssue, mockProjectPath);
      
      expect(result).toBeDefined();
      expect(result).toHaveProperty('functions');
      expect(result).toHaveProperty('classes');
      expect(result).toHaveProperty('interfaces');
      expect(result).toHaveProperty('variables');
      expect(result).toHaveProperty('dependencies');
    });

    it('should handle analysis errors gracefully', async () => {
      (fs.existsSync as jest.Mock).mockReturnValue(false);
      
      const result = await analyzer.analyzeCodeContext(mockIssue, mockProjectPath);
      
      expect(result).toBeDefined();
      // Should return empty/default context on error
    });

    it('should respect analysis options', async () => {
      const options = {
        maxDepth: 2,
        includeTests: false
      };
      
      const result = await analyzer.analyzeCodeContext(mockIssue, mockProjectPath, options);
      
      expect(result).toBeDefined();
    });
  });

  describe('resource monitoring', () => {
    it('should monitor resource usage during analysis', async () => {
      const monitorSpy = jest.spyOn(analyzer['resourceMonitor'], 'startAnalysis');
      
      await analyzer.analyzeCodeContext(mockIssue, mockProjectPath);
      
      expect(monitorSpy).toHaveBeenCalled();
    });
  });

  describe('language analysis integration', () => {
    it('should detect language from file extension', async () => {
      // analyzeCodeContextメソッドは内部でdetectLanguageを使用
      const result = await analyzer.analyzeCodeContext(mockIssue, mockProjectPath);
      
      // 結果が返されることを確認
      expect(result).toBeDefined();
      expect(result).toHaveProperty('language');
    });
  });

  describe('scope analysis integration', () => {
    it('should analyze code scopes', async () => {
      // analyzeCodeContextメソッドは内部でスコープ解析を実行
      const result = await analyzer.analyzeCodeContext(mockIssue, mockProjectPath);
      
      expect(result).toBeDefined();
      expect(result).toHaveProperty('scopes');
      expect(Array.isArray(result.scopes)).toBe(true);
    });
  });

  describe('file analysis integration', () => {
    it('should find related files', async () => {
      // analyzeCodeContextメソッドは内部で関連ファイル検索を実行
      const result = await analyzer.analyzeCodeContext(mockIssue, mockProjectPath);
      
      expect(result).toBeDefined();
      expect(result).toHaveProperty('relatedFiles');
      expect(Array.isArray(result.relatedFiles)).toBe(true);
    });
  });
});
