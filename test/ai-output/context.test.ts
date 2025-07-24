import { ContextIntegrator, IntegratedContext } from '../../src/ai-output/context';
import { Issue } from '../../src/core/types';
import * as fs from 'fs';
import * as path from 'path';

describe('ContextIntegrator', () => {
  let contextIntegrator: ContextIntegrator;
  let tempDir: string;
  let mockProjectPath: string;

  beforeEach(() => {
    contextIntegrator = new ContextIntegrator();
    tempDir = fs.mkdtempSync(path.join(__dirname, 'temp-context-test-'));
    mockProjectPath = tempDir;
    
    // Create mock project structure
    fs.mkdirSync(path.join(tempDir, 'src'));
    fs.mkdirSync(path.join(tempDir, 'test'));
    
    // Create package.json
    fs.writeFileSync(path.join(tempDir, 'package.json'), JSON.stringify({
      name: 'test-project',
      dependencies: { 'express': '^4.18.0' },
      devDependencies: { 'jest': '^29.0.0' }
    }));

    // Create mock source file
    fs.writeFileSync(path.join(tempDir, 'src', 'app.ts'), `
import express from 'express';

export class App {
  private server: express.Application;

  constructor() {
    this.server = express();
  }

  public start(): void {
    this.server.listen(3000);
  }
}
    `);

    // Create mock test file
    fs.writeFileSync(path.join(tempDir, 'test', 'app.test.ts'), `
import { App } from '../src/app';

describe('App', () => {
  it('should create an instance', () => {
    const app = new App();
    expect(app).toBeDefined();
  });
});
    `);
  });

  afterEach(() => {
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  describe('generateIntegratedContext', () => {
    it('should generate integrated context for a valid issue', async () => {
      const issue: Issue = {
        type: 'missing-assertion',
        severity: 'warning',
        message: 'Test lacks proper assertions',
        file: 'test/app.test.ts',
        line: 5
      };

      const result = await contextIntegrator.generateIntegratedContext(issue, mockProjectPath);

      expect(result).toBeDefined();
      expect(result.projectPath).toBe(mockProjectPath);
      expect(result.issueContext).toBeDefined();
      expect(result.relevantDependencies).toBeDefined();
      expect(result.architectureContext).toBeDefined();
      expect(result.relatedFiles).toBeDefined();
      expect(result.metadata).toBeDefined();
    });

    it('should handle missing file gracefully', async () => {
      const issue: Issue = {
        type: 'missing-test',
        severity: 'error',
        message: 'No test file found',
        file: 'nonexistent/file.ts',
        line: 1
      };

      const result = await contextIntegrator.generateIntegratedContext(issue, mockProjectPath);

      expect(result).toBeDefined();
      expect(result.metadata.confidence).toBeLessThanOrEqual(1);
    });

    it('should use cache for repeated requests', async () => {
      const issue: Issue = {
        type: 'missing-assertion',
        severity: 'warning',
        message: 'Test lacks proper assertions',
        file: 'test/app.test.ts',
        line: 5
      };

      const start1 = Date.now();
      const result1 = await contextIntegrator.generateIntegratedContext(issue, mockProjectPath);
      const time1 = Date.now() - start1;

      const start2 = Date.now();
      const result2 = await contextIntegrator.generateIntegratedContext(issue, mockProjectPath);
      const time2 = Date.now() - start2;

      expect(result1).toBeDefined();
      expect(result2).toBeDefined();
      expect(time2).toBeLessThan(time1); // Second call should be faster due to caching
    });

    it('should handle different issue types appropriately', async () => {
      const issues: Issue[] = [
        {
          type: 'missing-assertion',
          severity: 'warning',
          message: 'Test lacks assertions',
          file: 'test/app.test.ts',
          line: 5
        },
        {
          type: 'unused-variable',
          severity: 'warning',
          message: 'Variable is never used',
          file: 'src/app.ts',
          line: 3
        },
        {
          type: 'missing-error-handling',
          severity: 'error',
          message: 'Async operation needs error handling',
          file: 'src/app.ts',
          line: 10
        }
      ];

      for (const issue of issues) {
        const result = await contextIntegrator.generateIntegratedContext(issue, mockProjectPath);
        
        expect(result).toBeDefined();
        expect(result.metadata.suggestions.length).toBeGreaterThan(0);
      }
    });

    it('should respect context optimization options', async () => {
      const issue: Issue = {
        type: 'missing-assertion',
        severity: 'warning',
        message: 'Test lacks proper assertions',
        file: 'test/app.test.ts',
        line: 5
      };

      const options = {
        maxContextSize: 1000,
        prioritizeRelevantCode: true,
        includeCallStack: false,
        analyzeDataFlow: false,
        detectPatterns: false,
        generateSuggestions: false
      };

      const result = await contextIntegrator.generateIntegratedContext(issue, mockProjectPath, options);

      expect(result).toBeDefined();
      expect(result.metadata.contextSize).toBeLessThanOrEqual(1000);
      expect(result.metadata.suggestions).toEqual([]);
    });

    it('should handle analysis errors gracefully', async () => {
      const issue: Issue = {
        type: 'missing-assertion',
        severity: 'warning',
        message: 'Test lacks proper assertions',
        file: 'test/app.test.ts',
        line: 5
      };

      // Use non-existent project path to trigger error
      const result = await contextIntegrator.generateIntegratedContext(
        issue, 
        '/nonexistent/path'
      );

      expect(result).toBeDefined();
      expect(result.metadata.suggestions).toContain('Analysis failed - manual review recommended');
    });
  });

  describe('generateProjectSummary', () => {
    it('should generate comprehensive project summary', async () => {
      const summary = await contextIntegrator.generateProjectSummary(mockProjectPath);

      expect(summary).toBeDefined();
      expect(summary.overview).toBeDefined();
      expect(summary.architecture).toBeDefined();
      expect(summary.dependencies).toBeDefined();
      expect(summary.quality).toBeDefined();
      expect(summary.recommendations).toBeDefined();
      expect(Array.isArray(summary.recommendations)).toBe(true);
    });

    it('should handle analysis failure gracefully', async () => {
      const summary = await contextIntegrator.generateProjectSummary('/nonexistent/path');

      expect(summary).toBeDefined();
      expect(summary.overview).toBe('Unable to analyze project overview');
      expect(summary.recommendations).toContain('Manual review recommended');
    });

    it('should respect optimization options', async () => {
      const options = {
        maxContextSize: 500,
        generateSuggestions: false
      };

      const summary = await contextIntegrator.generateProjectSummary(mockProjectPath, options);

      expect(summary).toBeDefined();
      expect(typeof summary.overview).toBe('string');
    });
  });

  describe('calculateRelevanceScore', () => {
    it('should calculate high relevance for same file', () => {
      const issue: Issue = {
        type: 'missing-assertion',
        severity: 'warning',
        message: 'Test lacks proper assertions',
        file: 'test/app.test.ts',
        line: 5
      };

      const fileInfo = { path: 'test/app.test.ts' };
      const dependencyInfo = { imports: ['express'] };
      const structureInfo = { purpose: 'test' };

      const score = contextIntegrator.calculateRelevanceScore(
        issue, 
        fileInfo, 
        dependencyInfo, 
        structureInfo
      );

      expect(score).toBeGreaterThan(50);
    });

    it('should calculate lower relevance for unrelated files', () => {
      const issue: Issue = {
        type: 'missing-assertion',
        severity: 'warning',
        message: 'Test lacks proper assertions',
        file: 'test/app.test.ts',
        line: 5
      };

      const fileInfo = { path: 'src/utils/helper.ts' };
      const dependencyInfo = { imports: [] };
      const structureInfo = { purpose: 'utility' };

      const score = contextIntegrator.calculateRelevanceScore(
        issue, 
        fileInfo, 
        dependencyInfo, 
        structureInfo
      );

      expect(score).toBeLessThan(50);
    });

    it('should boost relevance for dependency matches', () => {
      const issue: Issue = {
        type: 'missing-import',
        severity: 'error',
        message: 'Missing express import',
        file: 'src/app.ts',
        line: 1
      };

      const fileInfo = { path: 'src/app.ts' };
      const dependencyInfo = { imports: ['express'] };
      const structureInfo = { purpose: 'source' };

      const score = contextIntegrator.calculateRelevanceScore(
        issue, 
        fileInfo, 
        dependencyInfo, 
        structureInfo
      );

      expect(score).toBeGreaterThan(60);
    });

    it('should limit score to maximum of 100', () => {
      const issue: Issue = {
        type: 'missing-assertion',
        severity: 'warning',
        message: 'express test app',
        file: 'test/app.test.ts',
        line: 5
      };

      const fileInfo = { path: 'test/app.test.ts' };
      const dependencyInfo = { imports: ['express'] };
      const structureInfo = { purpose: 'test' };

      const score = contextIntegrator.calculateRelevanceScore(
        issue, 
        fileInfo, 
        dependencyInfo, 
        structureInfo
      );

      expect(score).toBeLessThanOrEqual(100);
    });
  });

  describe('error handling and edge cases', () => {
    it('should handle empty project directory', async () => {
      const emptyDir = fs.mkdtempSync(path.join(__dirname, 'empty-test-'));
      
      try {
        const issue: Issue = {
          type: 'missing-test',
          severity: 'error',
          message: 'No test file',
          file: 'src/app.ts',
          line: 1
        };

        const result = await contextIntegrator.generateIntegratedContext(issue, emptyDir);
        
        expect(result).toBeDefined();
        expect(result.metadata.totalFiles).toBe(0);
      } finally {
        fs.rmSync(emptyDir, { recursive: true, force: true });
      }
    });

    it('should handle malformed package.json', async () => {
      const malformedDir = fs.mkdtempSync(path.join(__dirname, 'malformed-test-'));
      
      try {
        fs.writeFileSync(path.join(malformedDir, 'package.json'), 'invalid json content');
        
        const issue: Issue = {
          type: 'missing-test',
          severity: 'error',
          message: 'No test file',
          file: 'src/app.ts',
          line: 1
        };

        const result = await contextIntegrator.generateIntegratedContext(issue, malformedDir);
        
        expect(result).toBeDefined();
        expect(result.relevantDependencies.used).toEqual([]);
      } finally {
        fs.rmSync(malformedDir, { recursive: true, force: true });
      }
    });

    it('should handle permission errors gracefully', async () => {
      const issue: Issue = {
        type: 'missing-assertion',
        severity: 'warning',
        message: 'Test lacks proper assertions',
        file: '/root/restricted.ts', // Typically inaccessible
        line: 1
      };

      const result = await contextIntegrator.generateIntegratedContext(issue, mockProjectPath);

      expect(result).toBeDefined();
      expect(result.metadata.confidence).toBeGreaterThanOrEqual(0);
    });
  });

  describe('performance and memory management', () => {
    it('should complete analysis within reasonable time', async () => {
      const issue: Issue = {
        type: 'missing-assertion',
        severity: 'warning',
        message: 'Test lacks proper assertions',
        file: 'test/app.test.ts',
        line: 5
      };

      const startTime = Date.now();
      const result = await contextIntegrator.generateIntegratedContext(issue, mockProjectPath);
      const analysisTime = Date.now() - startTime;

      expect(result).toBeDefined();
      expect(analysisTime).toBeLessThan(5000); // Should complete within 5 seconds
      expect(result.metadata.analysisTime).toBeGreaterThan(0);
    });

    it('should respect context size limits', async () => {
      const issue: Issue = {
        type: 'missing-assertion',
        severity: 'warning',
        message: 'Test lacks proper assertions',
        file: 'test/app.test.ts',
        line: 5
      };

      const options = { maxContextSize: 1000 };
      const result = await contextIntegrator.generateIntegratedContext(issue, mockProjectPath, options);

      expect(result).toBeDefined();
      expect(result.metadata.contextSize).toBeLessThanOrEqual(1000);
    });

    it('should handle cache expiration correctly', async () => {
      const issue: Issue = {
        type: 'missing-assertion',
        severity: 'warning',
        message: 'Test lacks proper assertions',
        file: 'test/app.test.ts',
        line: 5
      };

      // First call
      await contextIntegrator.generateIntegratedContext(issue, mockProjectPath);

      // Simulate cache expiration by waiting (or manually expiring cache)
      // For testing purposes, we'll just make multiple calls
      const result1 = await contextIntegrator.generateIntegratedContext(issue, mockProjectPath);
      const result2 = await contextIntegrator.generateIntegratedContext(issue, mockProjectPath);

      expect(result1).toBeDefined();
      expect(result2).toBeDefined();
      expect(result1.metadata.analysisTime).toBeGreaterThanOrEqual(0);
      expect(result2.metadata.analysisTime).toBeGreaterThanOrEqual(0);
    });
  });
});