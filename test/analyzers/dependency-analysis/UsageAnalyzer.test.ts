import { UsageAnalyzer } from '../../../src/analyzers/dependency-analysis/usage-analyzer';
import * as fs from 'fs';
import * as path from 'path';
import * as glob from 'glob';

// モックの設定
jest.mock('fs');
jest.mock('glob');

describe('UsageAnalyzer', () => {
  let analyzer: UsageAnalyzer;
  const mockFs = fs as jest.Mocked<typeof fs>;
  const mockGlob = glob as jest.Mocked<typeof glob>;
  
  beforeEach(() => {
    analyzer = new UsageAnalyzer();
    jest.clearAllMocks();
  });

  describe('findUsedPackages', () => {
    it('should find all imported packages in TypeScript files', async () => {
      const mockFiles = [
        '/project/src/index.ts',
        '/project/src/utils.ts'
      ];

      const mockFileContents = {
        '/project/src/index.ts': `
          import express from 'express';
          import { Router } from 'express';
          import * as path from 'path';
          import lodash from 'lodash';
        `,
        '/project/src/utils.ts': `
          import axios from 'axios';
          const fs = require('fs');
          const moment = require('moment');
        `
      };

      (mockGlob.sync as jest.Mock).mockReturnValue(mockFiles);
      mockFs.readFileSync.mockImplementation((filePath: string) => {
        return mockFileContents[filePath as keyof typeof mockFileContents] || '';
      });

      const result = await analyzer.findUsedPackages('/project');
      
      expect(result).toContain('express');
      expect(result).toContain('lodash');
      expect(result).toContain('axios');
      expect(result).toContain('moment');
      expect(result).not.toContain('path'); // Built-in module
      expect(result).not.toContain('fs');    // Built-in module
    });

    it('should handle scoped packages correctly', async () => {
      const mockFiles = ['/project/src/app.ts'];
      const mockContent = `
        import { Component } from '@angular/core';
        import { HttpClient } from '@angular/common/http';
        import * as Sentry from '@sentry/node';
        const parser = require('@babel/parser');
      `;

      (mockGlob.sync as jest.Mock).mockReturnValue(mockFiles);
      mockFs.readFileSync.mockReturnValue(mockContent);

      const result = await analyzer.findUsedPackages('/project');
      
      expect(result).toContain('@angular/core');
      expect(result).toContain('@angular/common');
      expect(result).toContain('@sentry/node');
      expect(result).toContain('@babel/parser');
    });

    it('should handle dynamic imports', async () => {
      const mockFiles = ['/project/src/lazy.ts'];
      const mockContent = `
        async function loadModule() {
          const { default: chalk } = await import('chalk');
          const ora = await import('ora');
          return import('commander').then(m => m.Command);
        }
      `;

      (mockGlob.sync as jest.Mock).mockReturnValue(mockFiles);
      mockFs.readFileSync.mockReturnValue(mockContent);

      const result = await analyzer.findUsedPackages('/project');
      
      expect(result).toContain('chalk');
      expect(result).toContain('ora');
      expect(result).toContain('commander');
    });

    it('should ignore relative imports', async () => {
      const mockFiles = ['/project/src/components.ts'];
      const mockContent = `
        import { helper } from './utils';
        import Component from '../components/Button';
        import { config } from '../../config';
        import express from 'express';
      `;

      (mockGlob.sync as jest.Mock).mockReturnValue(mockFiles);
      mockFs.readFileSync.mockReturnValue(mockContent);

      const result = await analyzer.findUsedPackages('/project');
      
      expect(result).toContain('express');
      expect(result).not.toContain('./utils');
      expect(result).not.toContain('../components/Button');
      expect(result).not.toContain('../../config');
    });
  });

  describe('analyzeUsageFrequency', () => {
    it('should count usage frequency of each package', async () => {
      const mockFiles = [
        '/project/src/file1.ts',
        '/project/src/file2.ts',
        '/project/src/file3.ts'
      ];

      const mockFileContents = {
        '/project/src/file1.ts': `
          import express from 'express';
          import lodash from 'lodash';
        `,
        '/project/src/file2.ts': `
          import express from 'express';
          import axios from 'axios';
        `,
        '/project/src/file3.ts': `
          import express from 'express';
        `
      };

      (mockGlob.sync as jest.Mock).mockReturnValue(mockFiles);
      mockFs.readFileSync.mockImplementation((filePath: string) => {
        return mockFileContents[filePath as keyof typeof mockFileContents] || '';
      });

      const result = await analyzer.analyzeUsageFrequency('/project');
      
      expect(result.get('express')).toBe(3);
      expect(result.get('lodash')).toBe(1);
      expect(result.get('axios')).toBe(1);
    });
  });

  describe('findImportLocations', () => {
    it('should find all locations where a package is imported', async () => {
      const mockFiles = [
        '/project/src/app.ts',
        '/project/src/server.ts',
        '/project/src/utils.ts'
      ];

      const mockFileContents = {
        '/project/src/app.ts': `import express from 'express';`,
        '/project/src/server.ts': `import express from 'express';`,
        '/project/src/utils.ts': `import lodash from 'lodash';`
      };

      (mockGlob.sync as jest.Mock).mockReturnValue(mockFiles);
      mockFs.readFileSync.mockImplementation((filePath: string) => {
        return mockFileContents[filePath as keyof typeof mockFileContents] || '';
      });

      const result = await analyzer.findImportLocations('/project', 'express');
      
      expect(result).toHaveLength(2);
      expect(result).toContainEqual(expect.objectContaining({
        file: '/project/src/app.ts',
        line: 1
      }));
      expect(result).toContainEqual(expect.objectContaining({
        file: '/project/src/server.ts',
        line: 1
      }));
    });

    it('should handle multiple imports in the same file', async () => {
      const mockFiles = ['/project/src/complex.ts'];
      const mockContent = `
import express from 'express';
import path from 'path';

// Some code here

const router = require('express').Router();

function test() {
  const app = require('express')();
}`;

      (mockGlob.sync as jest.Mock).mockReturnValue(mockFiles);
      mockFs.readFileSync.mockReturnValue(mockContent);

      const result = await analyzer.findImportLocations('/project', 'express');
      
      expect(result).toHaveLength(3);
      expect(result[0].line).toBe(2);
      expect(result[1].line).toBe(7);
      expect(result[2].line).toBe(10);
    });
  });

  describe('detectCircularImports', () => {
    it('should detect circular dependencies between packages', async () => {
      // This would be implemented by analyzing import patterns
      // For now, we'll create a simple test case
      const mockDependencyGraph = new Map([
        ['package-a', new Set(['package-b'])],
        ['package-b', new Set(['package-c'])],
        ['package-c', new Set(['package-a'])] // Circular dependency
      ]);

      jest.spyOn(analyzer as any, 'buildDependencyGraph').mockResolvedValue(mockDependencyGraph);

      const result = await analyzer.detectCircularImports('/project');
      
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual(['package-a', 'package-b', 'package-c', 'package-a']);
    });

    it('should return empty array when no circular dependencies exist', async () => {
      const mockDependencyGraph = new Map([
        ['package-a', new Set(['package-b'])],
        ['package-b', new Set(['package-c'])],
        ['package-c', new Set([])]
      ]);

      jest.spyOn(analyzer as any, 'buildDependencyGraph').mockResolvedValue(mockDependencyGraph);

      const result = await analyzer.detectCircularImports('/project');
      
      expect(result).toHaveLength(0);
    });
  });

  describe('analyzeImportDepth', () => {
    it('should calculate the depth of import chains', async () => {
      const mockFiles = [
        '/project/src/index.ts',
        '/project/src/services/auth.ts',
        '/project/src/utils/helpers.ts'
      ];

      const mockFileContents = {
        '/project/src/index.ts': `import { AuthService } from './services/auth';`,
        '/project/src/services/auth.ts': `import { helper } from '../utils/helpers';`,
        '/project/src/utils/helpers.ts': `import lodash from 'lodash';`
      };

      (mockGlob.sync as jest.Mock).mockReturnValue(mockFiles);
      mockFs.readFileSync.mockImplementation((filePath: string) => {
        return mockFileContents[filePath as keyof typeof mockFileContents] || '';
      });

      const result = await analyzer.analyzeImportDepth('/project');
      
      expect(result.maxDepth).toBe(3);
      expect(result.averageDepth).toBeGreaterThan(0);
      expect(result.deepImports).toBeDefined();
    });
  });

  describe('categorizeUsage', () => {
    it('should categorize packages by their usage patterns', async () => {
      const mockUsageData = new Map([
        ['express', 10],      // Core dependency (high usage)
        ['lodash', 8],        // Core dependency (high usage)
        ['test-lib', 2],      // Peripheral dependency (low usage)
        ['unused-lib', 0]     // Unused dependency
      ]);

      jest.spyOn(analyzer, 'analyzeUsageFrequency').mockResolvedValue(mockUsageData);

      const result = await analyzer.categorizeUsage('/project');
      
      expect(result.core).toContain('express');
      expect(result.core).toContain('lodash');
      expect(result.peripheral).toContain('test-lib');
      expect(result.unused).toContain('unused-lib');
    });
  });

  describe('generateUsageReport', () => {
    it('should generate a comprehensive usage report', async () => {
      const mockPackages = new Set(['express', 'lodash', 'axios']);
      const mockFrequency = new Map([
        ['express', 5],
        ['lodash', 3],
        ['axios', 1]
      ]);

      jest.spyOn(analyzer, 'findUsedPackages').mockResolvedValue(mockPackages);
      jest.spyOn(analyzer, 'analyzeUsageFrequency').mockResolvedValue(mockFrequency);

      const report = await analyzer.generateUsageReport('/project');
      
      expect(report).toHaveProperty('totalPackages', 3);
      expect(report).toHaveProperty('usageStatistics');
      expect(report.usageStatistics).toContainEqual(
        expect.objectContaining({
          package: 'express',
          frequency: 5,
          percentage: expect.any(Number)
        })
      );
    });
  });
});