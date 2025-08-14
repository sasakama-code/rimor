import { PackageAnalyzer } from '../../../src/analyzers/dependency-analysis/package-analyzer';
import * as fs from 'fs';
import * as path from 'path';

// モックの設定
jest.mock('fs');

describe('PackageAnalyzer', () => {
  let analyzer: PackageAnalyzer;
  const mockFs = fs as jest.Mocked<typeof fs>;
  
  beforeEach(() => {
    analyzer = new PackageAnalyzer();
    jest.clearAllMocks();
  });

  describe('detectPackageManager', () => {
    it('should detect yarn when yarn.lock exists', async () => {
      mockFs.existsSync.mockImplementation((filePath: fs.PathLike) => {
        const path = filePath.toString();
        return path.endsWith('yarn.lock');
      });

      const result = await analyzer.detectPackageManager('/test/project');
      expect(result).toBe('yarn');
    });

    it('should detect pnpm when pnpm-lock.yaml exists', async () => {
      mockFs.existsSync.mockImplementation((filePath: fs.PathLike) => {
        const path = filePath.toString();
        return path.endsWith('pnpm-lock.yaml');
      });

      const result = await analyzer.detectPackageManager('/test/project');
      expect(result).toBe('pnpm');
    });

    it('should detect npm when package-lock.json exists', async () => {
      mockFs.existsSync.mockImplementation((filePath: fs.PathLike) => {
        const path = filePath.toString();
        return path.endsWith('package-lock.json');
      });

      const result = await analyzer.detectPackageManager('/test/project');
      expect(result).toBe('npm');
    });

    it('should return npm as default when no lock file exists', async () => {
      mockFs.existsSync.mockReturnValue(false);

      const result = await analyzer.detectPackageManager('/test/project');
      expect(result).toBe('npm');
    });
  });

  describe('analyzePackageJson', () => {
    it('should parse and analyze package.json correctly', async () => {
      const mockPackageJson = {
        name: 'test-project',
        version: '1.0.0',
        dependencies: {
          'express': '^4.18.0',
          'lodash': '~4.17.21'
        },
        devDependencies: {
          'jest': '^29.0.0',
          'typescript': '^5.0.0'
        },
        peerDependencies: {
          'react': '>=16.8.0'
        }
      };

      mockFs.existsSync.mockImplementation((filePath: fs.PathLike) => {
        const path = filePath.toString();
        return path.endsWith('package.json');
      });
      mockFs.readFileSync.mockReturnValue(JSON.stringify(mockPackageJson));

      const result = await analyzer.analyzePackageJson('/test/project');
      
      expect(result).toEqual({
        name: 'test-project',
        version: '1.0.0',
        dependencies: expect.objectContaining({
          express: '^4.18.0',
          lodash: '~4.17.21'
        }),
        devDependencies: expect.objectContaining({
          jest: '^29.0.0',
          typescript: '^5.0.0'
        }),
        peerDependencies: expect.objectContaining({
          react: '>=16.8.0'
        }),
        allDependencies: expect.arrayContaining([
          'express', 'lodash', 'jest', 'typescript', 'react'
        ])
      });
    });

    it('should return empty object when package.json does not exist', async () => {
      mockFs.existsSync.mockReturnValue(false);

      const result = await analyzer.analyzePackageJson('/test/project');
      
      expect(result).toEqual({
        name: undefined,
        version: undefined,
        dependencies: {},
        devDependencies: {},
        peerDependencies: {},
        allDependencies: []
      });
    });

    it('should handle invalid package.json gracefully', async () => {
      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockReturnValue('invalid json');

      const result = await analyzer.analyzePackageJson('/test/project');
      
      expect(result).toEqual({
        name: undefined,
        version: undefined,
        dependencies: {},
        devDependencies: {},
        peerDependencies: {},
        allDependencies: []
      });
    });
  });

  describe('findUnusedDependencies', () => {
    it('should identify unused dependencies', async () => {
      const mockPackageJson = {
        dependencies: {
          'express': '^4.18.0',
          'lodash': '~4.17.21',
          'axios': '^1.0.0'
        }
      };

      mockFs.existsSync.mockImplementation((filePath: fs.PathLike) => {
        const path = filePath.toString();
        return path.endsWith('package.json');
      });
      mockFs.readFileSync.mockReturnValue(JSON.stringify(mockPackageJson));

      // Mock file system for project files
      const usedImports = new Set(['express', 'lodash']);
      jest.spyOn(analyzer as any, 'findUsedPackages').mockResolvedValue(usedImports);

      const result = await analyzer.findUnusedDependencies('/test/project');
      
      expect(result).toEqual(['axios']);
    });

    it('should handle scoped packages correctly', async () => {
      const mockPackageJson = {
        dependencies: {
          '@angular/core': '^15.0.0',
          '@angular/common': '^15.0.0',
          '@types/node': '^18.0.0'
        }
      };

      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockReturnValue(JSON.stringify(mockPackageJson));

      const usedImports = new Set(['@angular/core']);
      jest.spyOn(analyzer as any, 'findUsedPackages').mockResolvedValue(usedImports);

      const result = await analyzer.findUnusedDependencies('/test/project');
      
      expect(result).toEqual(['@angular/common', '@types/node']);
    });
  });

  describe('analyzeVersionConstraints', () => {
    it('should analyze version constraints and identify issues', async () => {
      const mockPackageJson = {
        dependencies: {
          'express': '^4.18.0',    // caret range
          'lodash': '~4.17.21',     // tilde range
          'axios': '1.0.0',         // exact version
          'react': '>=16.8.0',      // minimum version
          'vue': '*'                // any version
        }
      };

      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockReturnValue(JSON.stringify(mockPackageJson));

      const result = await analyzer.analyzeVersionConstraints('/test/project');
      
      expect(result).toContainEqual(expect.objectContaining({
        package: 'express',
        constraint: '^4.18.0',
        type: 'caret',
        isRisky: false
      }));
      
      expect(result).toContainEqual(expect.objectContaining({
        package: 'lodash',
        constraint: '~4.17.21',
        type: 'tilde',
        isRisky: false
      }));
      
      expect(result).toContainEqual(expect.objectContaining({
        package: 'axios',
        constraint: '1.0.0',
        type: 'exact',
        isRisky: false
      }));
      
      expect(result).toContainEqual(expect.objectContaining({
        package: 'react',
        constraint: '>=16.8.0',
        type: 'range',
        isRisky: true
      }));
      
      expect(result).toContainEqual(expect.objectContaining({
        package: 'vue',
        constraint: '*',
        type: 'any',
        isRisky: true
      }));
    });
  });

  describe('parseLockFiles', () => {
    it('should parse yarn.lock correctly', async () => {
      const mockYarnLock = `
express@^4.18.0:
  version "4.18.2"
  resolved "https://registry.yarnpkg.com/express/-/express-4.18.2.tgz"
  integrity sha512-xxx

lodash@~4.17.21:
  version "4.17.21"
  resolved "https://registry.yarnpkg.com/lodash/-/lodash-4.17.21.tgz"
  integrity sha512-yyy
`;

      mockFs.existsSync.mockImplementation((filePath: fs.PathLike) => {
        const path = filePath.toString();
        return path.endsWith('yarn.lock');
      });
      mockFs.readFileSync.mockReturnValue(mockYarnLock);

      const result = await analyzer.parseLockFiles('/test/project');
      
      expect(result.get('express')).toBe('4.18.2');
      expect(result.get('lodash')).toBe('4.17.21');
    });

    it('should parse package-lock.json correctly', async () => {
      const mockPackageLock = {
        lockfileVersion: 2,
        packages: {
          'node_modules/express': {
            version: '4.18.2'
          },
          'node_modules/lodash': {
            version: '4.17.21'
          }
        }
      };

      mockFs.existsSync.mockImplementation((filePath: fs.PathLike) => {
        const path = filePath.toString();
        return path.endsWith('package-lock.json');
      });
      mockFs.readFileSync.mockReturnValue(JSON.stringify(mockPackageLock));

      const result = await analyzer.parseLockFiles('/test/project');
      
      expect(result.get('express')).toBe('4.18.2');
      expect(result.get('lodash')).toBe('4.17.21');
    });

    it('should prioritize yarn.lock over package-lock.json', async () => {
      const mockYarnLock = `
express@^4.18.0:
  version "4.18.3"
`;
      const mockPackageLock = {
        packages: {
          'node_modules/express': {
            version: '4.18.2'
          }
        }
      };

      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockImplementation((filePath: fs.PathOrFileDescriptor) => {
        const path = typeof filePath === 'string' ? filePath : 
                     typeof filePath === 'number' ? filePath.toString() : 
                     filePath.toString();
        if (path.endsWith('yarn.lock')) {
          return mockYarnLock;
        }
        return JSON.stringify(mockPackageLock);
      });

      const result = await analyzer.parseLockFiles('/test/project');
      
      expect(result.get('express')).toBe('4.18.3'); // yarn.lock version
    });
  });

  describe('findMissingDependencies', () => {
    it('should identify missing dependencies from imports', async () => {
      const mockPackageJson = {
        dependencies: {
          'express': '^4.18.0'
        }
      };

      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockReturnValue(JSON.stringify(mockPackageJson));

      // Mock imports found in code
      const usedImports = new Set(['express', 'lodash', 'axios']);
      jest.spyOn(analyzer as any, 'findUsedPackages').mockResolvedValue(usedImports);

      const result = await analyzer.findMissingDependencies('/test/project');
      
      expect(result).toEqual(['lodash', 'axios']);
    });

    it('should exclude built-in Node.js modules', async () => {
      const mockPackageJson = {
        dependencies: {}
      };

      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockReturnValue(JSON.stringify(mockPackageJson));

      // Mock imports including built-in modules
      const usedImports = new Set(['fs', 'path', 'http', 'express']);
      jest.spyOn(analyzer as any, 'findUsedPackages').mockResolvedValue(usedImports);

      const result = await analyzer.findMissingDependencies('/test/project');
      
      expect(result).toEqual(['express']); // Only external package
    });
  });
});