import { ProjectInferenceEngine, ProjectInferenceResult } from '../../src/ai-output/projectInference';
import * as fs from 'fs';
import * as path from 'path';

jest.mock('fs');
jest.mock('path');

describe('ProjectInferenceEngine', () => {
  let engine: ProjectInferenceEngine;
  const mockProjectPath = '/test/project';

  beforeEach(() => {
    engine = new ProjectInferenceEngine();
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('inferProject', () => {
    it('should successfully infer project details', async () => {
      // Mock file system operations
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.readFileSync as jest.Mock).mockReturnValue('{}');
      (fs.readdirSync as jest.Mock).mockReturnValue([]);
      
      const result = await engine.inferProject(mockProjectPath);
      
      expect(result).toHaveProperty('projectType');
      expect(result).toHaveProperty('language');
      expect(result).toHaveProperty('testFramework');
      expect(result).toHaveProperty('buildTool');
      expect(result).toHaveProperty('architecturePattern');
      expect(result).toHaveProperty('frameworks');
      expect(result).toHaveProperty('confidence');
      expect(result).toHaveProperty('evidence');
    });

    it('should handle non-existent project path gracefully', async () => {
      (fs.existsSync as jest.Mock).mockReturnValue(false);
      
      const result = await engine.inferProject(mockProjectPath);
      
      expect(result.projectType.type).toBe('unknown');
      expect(result.confidence).toBeLessThan(0.5);
    });
  });

  describe('language detection', () => {
    it('should detect TypeScript project', async () => {
      (fs.existsSync as jest.Mock).mockImplementation((path: string) => {
        return path.includes('tsconfig.json');
      });
      
      (fs.readFileSync as jest.Mock).mockImplementation((path: string) => {
        if (path.includes('package.json')) {
          return JSON.stringify({
            devDependencies: {
              typescript: '^4.0.0'
            }
          });
        }
        return '{}';
      });
      
      const result = await engine.inferProject(mockProjectPath);
      
      expect(result.language.language).toBe('typescript');
    });
  });

  describe('test framework detection', () => {
    it('should detect Jest framework', async () => {
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.readFileSync as jest.Mock).mockImplementation((path: string) => {
        if (path.includes('package.json')) {
          return JSON.stringify({
            devDependencies: {
              jest: '^27.0.0'
            }
          });
        }
        return '{}';
      });
      
      const result = await engine.inferProject(mockProjectPath);
      
      expect(result.testFramework.framework).toBe('jest');
    });
  });

  describe('build tool detection', () => {
    it('should detect Webpack build tool', async () => {
      (fs.existsSync as jest.Mock).mockImplementation((path: string) => {
        return path.includes('webpack.config');
      });
      
      const result = await engine.inferProject(mockProjectPath);
      
      expect(result.buildTool.tool).toBe('webpack');
    });
  });

  describe('architecture pattern detection', () => {
    it('should detect MVC pattern', async () => {
      (fs.readdirSync as jest.Mock).mockReturnValue([
        { name: 'models', isDirectory: () => true },
        { name: 'views', isDirectory: () => true },
        { name: 'controllers', isDirectory: () => true }
      ]);
      
      const result = await engine.inferProject(mockProjectPath);
      
      expect(result.architecturePattern.pattern).toBe('mvc');
    });
  });

  describe('framework detection', () => {
    it('should detect React framework', async () => {
      (fs.readFileSync as jest.Mock).mockImplementation((path: string) => {
        if (path.includes('package.json')) {
          return JSON.stringify({
            dependencies: {
              react: '^18.0.0'
            }
          });
        }
        return '{}';
      });
      
      const result = await engine.inferProject(mockProjectPath);
      
      expect(result.frameworks).toContainEqual(
        expect.objectContaining({
          name: 'react'
        })
      );
    });
  });
});
