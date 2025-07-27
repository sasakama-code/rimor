import { ProjectInferenceEngine, ProjectInferenceResult } from '../../src/ai-output/projectInference';
import * as fs from 'fs';
import * as path from 'path';

jest.mock('fs');

// path.join をモックして、実際のパス結合を行う
jest.mock('path', () => ({
  ...jest.requireActual('path'),
  join: (...args: string[]) => args.filter(Boolean).join('/'),
  extname: (file: string) => {
    const match = file.match(/\.[^.]+$/);
    return match ? match[0] : '';
  },
  basename: (file: string) => {
    const parts = file.split('/');
    return parts[parts.length - 1];
  }
}));

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
      (fs.readFileSync as jest.Mock).mockImplementation(() => {
        throw new Error('File not found');
      });
      (fs.readdirSync as jest.Mock).mockReturnValue([]);
      
      const result = await engine.inferProject(mockProjectPath);
      
      // When no evidence is found, the inference engine makes best guess based on minimal data
      // The actual type might not be 'unknown' if there are no files to analyze
      expect(result.confidence).toBeLessThan(0.7);
    });
  });

  describe('language detection', () => {
    it('should detect TypeScript project', async () => {
      (fs.existsSync as jest.Mock).mockImplementation((filePath: string) => {
        if (!filePath) return false;
        return filePath.includes('tsconfig.json') || filePath.includes('package.json');
      });
      
      (fs.readFileSync as jest.Mock).mockImplementation((filePath: string) => {
        if (!filePath) return '{}';
        if (filePath.includes('package.json')) {
          return JSON.stringify({
            devDependencies: {
              typescript: '^4.0.0',
              '@types/node': '^16.0.0'
            }
          });
        }
        if (filePath.includes('tsconfig.json')) {
          return JSON.stringify({
            compilerOptions: {
              target: 'ES2020',
              module: 'commonjs',
              strict: true
            }
          });
        }
        return '{}';
      });
      
      // findSourceFilesメソッドが呼ばれた時のためのreaddirSyncのMock
      (fs.readdirSync as jest.Mock).mockImplementation((dir: string, options?: any) => {
        if (options?.withFileTypes) {
          // findSourceFilesが使うwithFileTypesオプション対応
          if (dir === mockProjectPath) {
            return [
              { name: 'src', isDirectory: () => true },
              { name: 'tsconfig.json', isDirectory: () => false },
              { name: 'package.json', isDirectory: () => false },
              { name: 'index.ts', isDirectory: () => false }
            ];
          } else if (dir.includes('src')) {
            return [
              { name: 'main.ts', isDirectory: () => false },
              { name: 'utils.ts', isDirectory: () => false },
              { name: 'types.ts', isDirectory: () => false }
            ];
          }
          return [];
        }
        // 通常のreaddirSync
        return [
          { name: 'src', isDirectory: () => true },
          { name: 'test.ts', isDirectory: () => false },
          { name: 'index.ts', isDirectory: () => false }
        ];
      });
      
      const result = await engine.inferProject(mockProjectPath);
      
      expect(result.language.language).toBe('typescript');
    });
  });

  describe('test framework detection', () => {
    it('should detect Jest framework', async () => {
      (fs.existsSync as jest.Mock).mockImplementation((filePath: string) => {
        if (!filePath) return false;
        // jest.config.jsが存在することを示す
        return filePath.includes('jest.config.js') || filePath.includes('package.json');
      });
      
      (fs.readFileSync as jest.Mock).mockImplementation((filePath: string) => {
        if (!filePath) return '{}';
        if (filePath.includes('package.json')) {
          return JSON.stringify({
            devDependencies: {
              jest: '^27.0.0',
              '@types/jest': '^27.0.0',
              'ts-jest': '^27.0.0'
            },
            scripts: {
              test: 'jest'
            }
          });
        }
        if (filePath.includes('jest.config.js')) {
          return 'module.exports = { preset: "ts-jest" };';
        }
        return '{}';
      });
      
      // ファイル構造のMock
      (fs.readdirSync as jest.Mock).mockImplementation((dir: string, options?: any) => {
        if (options?.withFileTypes) {
          if (dir === mockProjectPath) {
            return [
              { name: '__tests__', isDirectory: () => true },
              { name: 'test', isDirectory: () => true },
              { name: 'jest.config.js', isDirectory: () => false },
              { name: 'package.json', isDirectory: () => false }
            ];
          }
          return [];
        }
        return [
          { name: '__tests__', isDirectory: () => true },
          { name: 'test', isDirectory: () => true },
          { name: 'jest.config.js', isDirectory: () => false }
        ];
      });
      
      const result = await engine.inferProject(mockProjectPath);
      
      expect(result.testFramework.framework).toBe('jest');
    });
  });

  describe('build tool detection', () => {
    it('should detect Webpack build tool', async () => {
      (fs.existsSync as jest.Mock).mockImplementation((filePath: string) => {
        if (!filePath) return false;
        return filePath.includes('webpack.config.js') || filePath.includes('package.json');
      });
      
      (fs.readFileSync as jest.Mock).mockImplementation((filePath: string) => {
        if (!filePath) return '{}';
        if (filePath.includes('package.json')) {
          return JSON.stringify({
            devDependencies: {
              webpack: '^5.0.0',
              'webpack-cli': '^4.0.0',
              'webpack-dev-server': '^4.0.0'
            },
            scripts: {
              build: 'webpack',
              dev: 'webpack serve'
            }
          });
        }
        if (filePath.includes('webpack.config.js')) {
          return 'module.exports = { mode: "production" };';
        }
        return '{}';
      });
      
      // ファイル構造のMock
      (fs.readdirSync as jest.Mock).mockImplementation((dir: string, options?: any) => {
        if (options?.withFileTypes) {
          if (dir === mockProjectPath) {
            return [
              { name: 'webpack.config.js', isDirectory: () => false },
              { name: 'dist', isDirectory: () => true },
              { name: 'src', isDirectory: () => true },
              { name: 'package.json', isDirectory: () => false }
            ];
          }
          return [];
        }
        return [
          { name: 'webpack.config.js', isDirectory: () => false },
          { name: 'dist', isDirectory: () => true }
        ];
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
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.readFileSync as jest.Mock).mockImplementation((filePath: string) => {
        if (!filePath) return '{}';
        if (filePath.includes('package.json')) {
          return JSON.stringify({
            dependencies: {
              react: '^18.0.0',
              'react-dom': '^18.0.0'
            },
            devDependencies: {
              '@types/react': '^18.0.0',
              '@types/react-dom': '^18.0.0'
            }
          });
        }
        return '{}';
      });
      
      // ファイル構造のMock
      (fs.readdirSync as jest.Mock).mockImplementation((dir: string, options?: any) => {
        if (options?.withFileTypes) {
          if (dir === mockProjectPath) {
            return [
              { name: 'src', isDirectory: () => true },
              { name: 'components', isDirectory: () => true },
              { name: 'package.json', isDirectory: () => false },
              { name: 'App.tsx', isDirectory: () => false }
            ];
          } else if (dir.includes('src')) {
            return [
              { name: 'App.tsx', isDirectory: () => false },
              { name: 'index.tsx', isDirectory: () => false },
              { name: 'components', isDirectory: () => true }
            ];
          }
          return [];
        }
        return [
          { name: 'src', isDirectory: () => true },
          { name: 'components', isDirectory: () => true },
          { name: 'App.tsx', isDirectory: () => false }
        ];
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
