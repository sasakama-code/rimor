import { FileAnalyzer } from '../../../src/analyzers/code-context/file';
import * as fs from 'fs';
import * as path from 'path';

jest.mock('fs');
jest.mock('path');

describe('FileAnalyzer', () => {
  let analyzer: FileAnalyzer;
  const mockFilePath = '/test/project/src/app.ts';
  const mockProjectPath = '/test/project';

  beforeEach(() => {
    analyzer = new FileAnalyzer();
    jest.clearAllMocks();
  });

  describe('findRelatedFiles', () => {
    it('should find related files for a given file', async () => {
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.readdirSync as jest.Mock).mockReturnValue([
        { name: 'app.test.ts', isDirectory: () => false },
        { name: 'app.spec.ts', isDirectory: () => false },
        { name: 'app.module.ts', isDirectory: () => false }
      ]);
      
      const relatedFiles = await analyzer.findRelatedFiles(mockFilePath, mockProjectPath);
      
      expect(relatedFiles).toBeInstanceOf(Array);
      expect(relatedFiles.length).toBeGreaterThan(0);
    });

    it('should handle non-existent files gracefully', async () => {
      (fs.existsSync as jest.Mock).mockReturnValue(false);
      
      const relatedFiles = await analyzer.findRelatedFiles(mockFilePath, mockProjectPath);
      
      expect(relatedFiles).toEqual([]);
    });
  });

  describe('analyzeFileContext', () => {
    it('should analyze file context and extract metadata', async () => {
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.readFileSync as jest.Mock).mockReturnValue(`
        import { Module } from '@nestjs/common';
        
        @Module({})
        export class AppModule {}
      `);
      
      const context = await analyzer.analyzeFileContext(mockFilePath);
      
      expect(context).toBeDefined();
      expect(context).toHaveProperty('imports');
      expect(context).toHaveProperty('exports');
    });
  });

  describe('getFileMetadata', () => {
    it('should extract file metadata', async () => {
      (fs.statSync as jest.Mock).mockReturnValue({
        size: 1024,
        mtime: new Date(),
        isFile: () => true,
        isDirectory: () => false
      });
      
      const metadata = await analyzer.getFileMetadata(mockFilePath);
      
      expect(metadata).toBeDefined();
      expect(metadata).toHaveProperty('size');
      expect(metadata).toHaveProperty('lastModified');
    });
  });

  describe('findTestFiles', () => {
    it('should find test files for a source file', async () => {
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.readdirSync as jest.Mock).mockReturnValue([
        { name: 'app.test.ts', isDirectory: () => false },
        { name: 'app.spec.ts', isDirectory: () => false }
      ]);
      
      const testFiles = await analyzer.findTestFiles(mockFilePath, mockProjectPath);
      
      expect(testFiles).toBeInstanceOf(Array);
      expect(testFiles.some(f => f.includes('.test.'))).toBe(true);
    });
  });

  describe('findImportingFiles', () => {
    it('should find files that import the target file', async () => {
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.readdirSync as jest.Mock).mockReturnValue([
        { name: 'main.ts', isDirectory: () => false }
      ]);
      (fs.readFileSync as jest.Mock).mockReturnValue(`
        import { AppModule } from './app';
      `);
      
      const importingFiles = await analyzer.findImportingFiles(mockFilePath, mockProjectPath);
      
      expect(importingFiles).toBeInstanceOf(Array);
    });
  });
});
