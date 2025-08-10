/**
 * FileDependencyAnalyzer テスト
 * Issue #65: analyzersディレクトリの責務分離
 * TDD RED段階: テストファースト
 */

import { FileDependencyAnalyzer } from '../../../src/analyzers/dependency-analysis/file-deps';
import { FileDependency } from '../../../src/analyzers/types';
import * as fs from 'fs';

jest.mock('fs');

describe('FileDependencyAnalyzer', () => {
  let analyzer: FileDependencyAnalyzer;

  beforeEach(() => {
    analyzer = new FileDependencyAnalyzer();
    jest.clearAllMocks();
  });

  describe('analyzeFileDependencies', () => {
    it('TypeScriptファイルのimport文を正しく解析する', async () => {
      // Arrange
      const mockFilePath = '/test/src/index.ts';
      const mockContent = `
        import express from 'express';
        import { Request, Response } from 'express';
        import * as path from 'path';
        import './utils/helper';
        import Component from '../components/Component';
      `;
      
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.readFileSync as jest.Mock).mockReturnValue(mockContent);

      // Act
      const result = await analyzer.analyzeFileDependencies(mockFilePath);

      // Assert
      expect(result).toBeDefined();
      expect(result.imports).toHaveLength(4); // expressが重複除去されるため4つ
      expect(result.imports).toContain('express');
      expect(result.imports).toContain('path');
      expect(result.imports).toContain('./utils/helper');
      expect(result.imports).toContain('../components/Component');
    });

    it('JavaScriptのrequire文を正しく解析する', async () => {
      // Arrange
      const mockFilePath = '/test/src/index.js';
      const mockContent = `
        const express = require('express');
        const { readFile } = require('fs');
        const utils = require('./utils');
      `;
      
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.readFileSync as jest.Mock).mockReturnValue(mockContent);

      // Act
      const result = await analyzer.analyzeFileDependencies(mockFilePath);

      // Assert
      expect(result).toBeDefined();
      expect(result.imports).toHaveLength(3);
      expect(result.imports).toContain('express');
      expect(result.imports).toContain('fs');
      expect(result.imports).toContain('./utils');
    });

    it('export文を正しく解析する', async () => {
      // Arrange
      const mockFilePath = '/test/src/module.ts';
      const mockContent = `
        export const myFunction = () => {};
        export default class MyClass {}
        export { something } from './other';
      `;
      
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.readFileSync as jest.Mock).mockReturnValue(mockContent);

      // Act
      const result = await analyzer.analyzeFileDependencies(mockFilePath);

      // Assert
      expect(result).toBeDefined();
      expect(result.exports).toHaveLength(3);
      expect(result.exports).toContain('myFunction');
      expect(result.exports).toContain('default');
      expect(result.exports).toContain('something');
    });

    it('ファイルが存在しない場合はエラーをスロー', async () => {
      // Arrange
      const mockFilePath = '/test/nonexistent.ts';
      (fs.existsSync as jest.Mock).mockReturnValue(false);

      // Act & Assert
      await expect(analyzer.analyzeFileDependencies(mockFilePath))
        .rejects.toThrow('File not found');
    });
  });

  describe('getImportType', () => {
    it('相対インポートを正しく判定する', () => {
      expect(analyzer.getImportType('./utils')).toBe('relative');
      expect(analyzer.getImportType('../components/Button')).toBe('relative');
    });

    it('絶対インポートを正しく判定する', () => {
      expect(analyzer.getImportType('express')).toBe('external');
      expect(analyzer.getImportType('@company/package')).toBe('external');
    });

    it('ビルトインモジュールを正しく判定する', () => {
      expect(analyzer.getImportType('fs')).toBe('builtin');
      expect(analyzer.getImportType('path')).toBe('builtin');
      expect(analyzer.getImportType('crypto')).toBe('builtin');
    });
  });
});