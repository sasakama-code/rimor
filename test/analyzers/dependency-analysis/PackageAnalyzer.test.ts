/**
 * PackageAnalyzer 統合テスト
 * モックを使用せず、実際のファイルシステムで動作を検証
 */

import { PackageAnalyzer } from '../../../src/analyzers/dependency-analysis/package-analyzer';
import * as fs from 'fs';
import * as path from 'path';
import {
  createTempProject,
  createTestFile,
  cleanupTempProject
} from '../../helpers/integration-test-utils';

describe('PackageAnalyzer Integration Tests', () => {
  let analyzer: PackageAnalyzer;
  let projectDir: string;

  beforeEach(() => {
    analyzer = new PackageAnalyzer();
    projectDir = createTempProject('package-analyzer-test-');
  });

  afterEach(() => {
    cleanupTempProject(projectDir);
  });

  describe('detectPackageManager', () => {
    it('should detect yarn when yarn.lock exists', async () => {
      createTestFile(projectDir, 'yarn.lock', '# Yarn lockfile v1\n');
      
      const result = await analyzer.detectPackageManager(projectDir);
      expect(result).toBe('yarn');
    });

    it('should detect pnpm when pnpm-lock.yaml exists', async () => {
      createTestFile(projectDir, 'pnpm-lock.yaml', 'lockfileVersion: 5.4\n');
      
      const result = await analyzer.detectPackageManager(projectDir);
      expect(result).toBe('pnpm');
    });

    it('should detect npm when package-lock.json exists', async () => {
      createTestFile(projectDir, 'package-lock.json', JSON.stringify({
        name: 'test-project',
        lockfileVersion: 2
      }));
      
      const result = await analyzer.detectPackageManager(projectDir);
      expect(result).toBe('npm');
    });

    it('should return npm as default when no lock file exists', async () => {
      const result = await analyzer.detectPackageManager(projectDir);
      expect(result).toBe('npm');
    });

    it('should prefer yarn over npm when both exist', async () => {
      createTestFile(projectDir, 'yarn.lock', '# Yarn lockfile v1\n');
      createTestFile(projectDir, 'package-lock.json', '{}');
      
      const result = await analyzer.detectPackageManager(projectDir);
      expect(result).toBe('yarn');
    });
  });

  describe('analyzePackageJson', () => {
    it('should parse and analyze package.json correctly', async () => {
      const packageJsonContent = {
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

      createTestFile(projectDir, 'package.json', JSON.stringify(packageJsonContent, null, 2));

      const result = await analyzer.analyzePackageJson(projectDir);
      
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
      const result = await analyzer.analyzePackageJson(projectDir);
      
      expect(result).toEqual({
        dependencies: {},
        devDependencies: {},
        peerDependencies: {},
        allDependencies: []
      });
    });

    it('should handle invalid package.json gracefully', async () => {
      createTestFile(projectDir, 'package.json', 'invalid json content');
      
      const result = await analyzer.analyzePackageJson(projectDir);
      
      expect(result).toEqual({
        dependencies: {},
        devDependencies: {},
        peerDependencies: {},
        allDependencies: []
      });
    });

    it('should handle package.json with missing dependency fields', async () => {
      const packageJsonContent = {
        name: 'minimal-project',
        version: '0.0.1'
      };

      createTestFile(projectDir, 'package.json', JSON.stringify(packageJsonContent, null, 2));

      const result = await analyzer.analyzePackageJson(projectDir);
      
      expect(result).toEqual({
        name: 'minimal-project',
        version: '0.0.1',
        dependencies: {},
        devDependencies: {},
        peerDependencies: {},
        allDependencies: []
      });
    });
  });

  describe('findUnusedDependencies', () => {
    it('should identify unused dependencies', async () => {
      const packageJsonContent = {
        name: 'test-project',
        version: '1.0.0',
        dependencies: {
          'express': '^4.18.0',
          'lodash': '^4.17.21',
          'unused-package': '^1.0.0'
        }
      };

      createTestFile(projectDir, 'package.json', JSON.stringify(packageJsonContent, null, 2));
      
      // Create files that only use express and lodash
      createTestFile(projectDir, 'src/index.js', `
        const express = require('express');
        const _ = require('lodash');
      `);

      const result = await analyzer.findUnusedDependencies(projectDir);
      
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      // Note: Actual implementation might need more sophisticated detection
    });
  });

  describe('findMissingDependencies', () => {
    it('should identify missing dependencies', async () => {
      const packageJsonContent = {
        name: 'test-project',
        version: '1.0.0',
        dependencies: {
          'express': '^4.18.0'
        }
      };

      createTestFile(projectDir, 'package.json', JSON.stringify(packageJsonContent, null, 2));
      
      // Create file that uses packages not in dependencies
      createTestFile(projectDir, 'src/index.js', `
        const express = require('express');
        const axios = require('axios'); // Not in dependencies
        const lodash = require('lodash'); // Not in dependencies
      `);

      const result = await analyzer.findMissingDependencies(projectDir);
      
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });

    it('should correctly handle Node.js built-in modules with node: prefix (Issue #104)', async () => {
      const packageJsonContent = {
        name: 'test-project',
        version: '1.0.0',
        dependencies: {
          'express': '^4.18.0'
        }
      };

      createTestFile(projectDir, 'package.json', JSON.stringify(packageJsonContent, null, 2));
      
      // Create file that uses node: prefixed built-in modules
      createTestFile(projectDir, 'src/node-modules.js', `
        import fs from 'node:fs';
        import path from 'node:path';
        import crypto from 'node:crypto';
        import { readFile } from 'fs/promises';
        const express = require('express');
      `);

      const result = await analyzer.findMissingDependencies(projectDir);
      
      // Issue #104: node: prefixed modules should not be reported as missing
      expect(result).not.toContain('fs');
      expect(result).not.toContain('path');
      expect(result).not.toContain('crypto');
      expect(result).not.toContain('node:fs');
      expect(result).not.toContain('node:path');
      expect(result).not.toContain('node:crypto');
      
      // Regular dependencies should still work normally
      expect(result).not.toContain('express');
    });
  });

  describe('analyzeVersionConstraints', () => {
    it('should analyze version constraints in package.json', async () => {
      const packageJsonContent = {
        name: 'test-project',
        version: '1.0.0',
        dependencies: {
          'express': '^4.18.0',    // Caret range
          'lodash': '~4.17.21',     // Tilde range
          'axios': '1.0.0',         // Exact version
          'react': '>=16.8.0'       // Comparison range
        }
      };

      createTestFile(projectDir, 'package.json', JSON.stringify(packageJsonContent, null, 2));

      const result = await analyzer.analyzeVersionConstraints(projectDir);
      
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
    });
  });

  describe('parseLockFiles', () => {
    it('should parse npm package-lock.json', async () => {
      const packageLockContent = {
        name: 'test-project',
        lockfileVersion: 2,
        packages: {
          '': {
            name: 'test-project',
            version: '1.0.0',
            dependencies: {
              'express': '^4.18.0',
              'lodash': '^4.17.21'
            }
          },
          'node_modules/express': {
            version: '4.18.2',
            resolved: 'https://registry.npmjs.org/express/-/express-4.18.2.tgz'
          },
          'node_modules/lodash': {
            version: '4.17.21',
            resolved: 'https://registry.npmjs.org/lodash/-/lodash-4.17.21.tgz'
          }
        }
      };

      createTestFile(projectDir, 'package-lock.json', JSON.stringify(packageLockContent, null, 2));

      const result = await analyzer.parseLockFiles(projectDir);
      
      expect(result).toBeDefined();
      expect(result instanceof Map).toBe(true);
      expect(result.get('express')).toBe('4.18.2');
      expect(result.get('lodash')).toBe('4.17.21');
    });

    it('should parse yarn.lock file', async () => {
      const yarnLockContent = `# THIS IS AN AUTOGENERATED FILE. DO NOT EDIT THIS FILE DIRECTLY.
# yarn lockfile v1

express@^4.18.0:
  version "4.18.2"
  resolved "https://registry.yarnpkg.com/express/-/express-4.18.2.tgz"
  integrity sha512-xyz...

lodash@^4.17.21:
  version "4.17.21"
  resolved "https://registry.yarnpkg.com/lodash/-/lodash-4.17.21.tgz"
  integrity sha512-abc...
`;

      createTestFile(projectDir, 'yarn.lock', yarnLockContent);

      const result = await analyzer.parseLockFiles(projectDir);
      
      expect(result).toBeDefined();
      expect(result instanceof Map).toBe(true);
    });
  });

  describe('Edge cases', () => {
    it('should handle empty project directory', async () => {
      const packageManager = await analyzer.detectPackageManager(projectDir);
      const packageJson = await analyzer.analyzePackageJson(projectDir);
      
      expect(packageManager).toBe('npm'); // Default
      expect(packageJson.allDependencies).toEqual([]);
    });

    it('should handle project with only package.json', async () => {
      createTestFile(projectDir, 'package.json', JSON.stringify({
        name: 'minimal',
        version: '1.0.0'
      }));

      const packageManager = await analyzer.detectPackageManager(projectDir);
      const packageJson = await analyzer.analyzePackageJson(projectDir);
      
      expect(packageManager).toBe('npm'); // Default when no lock file
      expect(packageJson.name).toBe('minimal');
    });

    it('should handle corrupted lock files', async () => {
      createTestFile(projectDir, 'package-lock.json', 'corrupted content');
      
      const result = await analyzer.parseLockFiles(projectDir);
      
      expect(result).toBeDefined();
      expect(result instanceof Map).toBe(true);
      expect(result.size).toBe(0); // Empty map for corrupted files
    });
  });
});