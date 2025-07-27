import { AdvancedCodeContextAnalyzer } from '../../../src/analyzers/code-context/core';
import { Issue } from '../../../src/core/types';
import * as fs from 'fs';
import * as path from 'path';

jest.mock('fs');
jest.mock('../../../src/analyzers/code-context/language');
jest.mock('../../../src/analyzers/code-context/scope');
jest.mock('../../../src/analyzers/code-context/file');
jest.mock('../../../src/analyzers/code-context/utils');

describe('AdvancedCodeContextAnalyzer', () => {
  let analyzer: AdvancedCodeContextAnalyzer;
  const mockProjectPath = '/test/project';
  const mockIssue: Issue = {
    filePath: '/test/project/src/app.ts',
    message: 'Test issue',
    severity: 'warning',
    ruleId: 'test-rule',
    line: 10,
    column: 5
  };

  beforeEach(() => {
    analyzer = new AdvancedCodeContextAnalyzer();
    jest.clearAllMocks();
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
    it('should use language analyzer for code parsing', async () => {
      const languageAnalyzer = require('../../../src/analyzers/code-context/language').LanguageAnalyzer;
      const detectLanguageSpy = jest.spyOn(languageAnalyzer.prototype, 'detectLanguage');
      
      await analyzer.analyzeCodeContext(mockIssue, mockProjectPath);
      
      expect(detectLanguageSpy).toHaveBeenCalled();
    });
  });

  describe('scope analysis integration', () => {
    it('should use scope analyzer for scope detection', async () => {
      const scopeAnalyzer = require('../../../src/analyzers/code-context/scope').ScopeAnalyzer;
      const analyzeScopeSpy = jest.spyOn(scopeAnalyzer.prototype, 'analyzeScope');
      
      await analyzer.analyzeCodeContext(mockIssue, mockProjectPath);
      
      expect(analyzeScopeSpy).toHaveBeenCalled();
    });
  });

  describe('file analysis integration', () => {
    it('should use file analyzer for related files', async () => {
      const fileAnalyzer = require('../../../src/analyzers/code-context/file').FileAnalyzer;
      const findRelatedFilesSpy = jest.spyOn(fileAnalyzer.prototype, 'findRelatedFiles');
      
      await analyzer.analyzeCodeContext(mockIssue, mockProjectPath);
      
      expect(findRelatedFilesSpy).toHaveBeenCalled();
    });
  });
});
