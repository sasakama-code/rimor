/**
 * RealWorldProjectValidator.test.ts
 * 実世界プロジェクト検証システムのテスト
 */

import { RealWorldProjectValidator } from '../../../src/security/validation/RealWorldProjectValidator';

describe('RealWorldProjectValidator - 実世界プロジェクト検証システム', () => {
  let validator: RealWorldProjectValidator;

  beforeEach(() => {
    validator = new RealWorldProjectValidator();
  });

  describe('プロジェクト構造分析', () => {
    it('標準的なNode.jsプロジェクト構造を検証すること', async () => {
      const nodeProject = {
        projectType: 'node',
        structure: {
          'src/': ['index.js', 'utils.js', 'config.js'],
          'test/': ['index.test.js', 'utils.test.js'],
          'package.json': true,
          'node_modules/': true
        },
        framework: 'express'
      };

      const result = await validator.validateNodeProject(nodeProject);

      expect(result).toBeDefined();
      expect(result.structureScore).toBeGreaterThan(0.8);
      expect(result.conventions.length).toBeGreaterThan(0);
      expect(result.bestPractices.adherence).toBeGreaterThan(0.7);
    });

    it('React プロジェクト構造を検証すること', async () => {
      const reactProject = {
        projectType: 'react',
        structure: {
          'src/': ['App.js', 'components/', 'hooks/', 'utils/'],
          'public/': ['index.html', 'favicon.ico'],
          'test/': ['App.test.js', '__mocks__/'],
          'package.json': true
        },
        framework: 'create-react-app'
      };

      const result = await validator.validateReactProject(reactProject);

      expect(result).toBeDefined();
      expect(result.componentStructure).toBeDefined();
      expect(result.testCoverage).toBeGreaterThan(0.6);
      expect(result.securityIssues.length).toBeLessThan(5);
    });

    it('TypeScript プロジェクト構造を検証すること', async () => {
      const typescriptProject = {
        projectType: 'typescript',
        structure: {
          'src/': ['index.ts', 'types/', 'interfaces/'],
          'test/': ['index.test.ts'],
          'tsconfig.json': true,
          'dist/': true
        },
        framework: 'typescript'
      };

      const result = await validator.validateTypeScriptProject(typescriptProject);

      expect(result).toBeDefined();
      expect(result.typesSafety).toBeGreaterThan(0.8);
      expect(result.compilation.success).toBe(true);
      expect(result.strictMode).toBe(true);
    });
  });

  describe('セキュリティ検証', () => {
    it('一般的なセキュリティ脆弱性を検出すること', async () => {
      const projectWithVulnerabilities = {
        files: [
          {
            path: 'src/auth.js',
            content: `
              function login(username, password) {
                const query = "SELECT * FROM users WHERE username = '" + username + "'";
                return database.query(query); // SQL Injection 脆弱性
              }
            `
          },
          {
            path: 'src/render.js',
            content: `
              function renderContent(userInput) {
                document.innerHTML = userInput; // XSS 脆弱性
              }
            `
          }
        ]
      };

      const result = await validator.validateSecurity(projectWithVulnerabilities);

      expect(result).toBeDefined();
      expect(result.vulnerabilities.length).toBeGreaterThan(0);
      expect(result.vulnerabilities.some(v => v.type === 'sql-injection')).toBe(true);
      expect(result.vulnerabilities.some(v => v.type === 'xss')).toBe(true);
      expect(result.securityScore).toBeLessThan(0.5);
    });

    it('依存関係の脆弱性を検出すること', async () => {
      const projectWithVulnerableDeps = {
        dependencies: {
          'lodash': '4.17.15', // 既知の脆弱性がある古いバージョン
          'express': '4.16.0', // 古いバージョン
          'mongoose': '5.0.0' // 古いバージョン
        }
      };

      const result = await validator.validateDependencies(projectWithVulnerableDeps);

      expect(result).toBeDefined();
      expect(result.vulnerableDependencies.length).toBeGreaterThan(0);
      expect(result.outdatedDependencies.length).toBeGreaterThan(0);
      expect(result.securityAdvisories.length).toBeGreaterThan(0);
    });

    it('設定ファイルのセキュリティを検証すること', async () => {
      const configFiles = {
        '.env': 'DATABASE_PASSWORD=plaintext_password\nAPI_KEY=exposed_key',
        'config.js': `
          module.exports = {
            database: {
              host: 'localhost',
              password: 'hardcoded_password' // ハードコードされたパスワード
            }
          }
        `
      };

      const result = await validator.validateConfiguration(configFiles);

      expect(result).toBeDefined();
      expect(result.exposedSecrets.length).toBeGreaterThan(0);
      expect(result.hardcodedCredentials.length).toBeGreaterThan(0);
      expect(result.configurationScore).toBeLessThan(0.6);
    });
  });

  describe('テスト品質分析', () => {
    it('テストカバレッジを分析すること', async () => {
      const projectWithTests = {
        sourceFiles: [
          'src/auth.js',
          'src/user.js',
          'src/database.js',
          'src/utils.js'
        ],
        testFiles: [
          'test/auth.test.js',
          'test/user.test.js'
        ],
        coverage: {
          lines: 75,
          functions: 80,
          branches: 65,
          statements: 78
        }
      };

      const result = await validator.analyzeTestQuality(projectWithTests);

      expect(result).toBeDefined();
      expect(result.coverageAnalysis).toBeDefined();
      expect(result.missingTests).toContain('src/database.js');
      expect(result.missingTests).toContain('src/utils.js');
      expect(result.testQualityScore).toBeGreaterThan(0.7);
    });

    it('テストの実行パフォーマンスを検証すること', async () => {
      const testSuite = {
        tests: [
          { name: 'auth tests', duration: 1500, passed: 10, failed: 0 },
          { name: 'user tests', duration: 2000, passed: 15, failed: 1 },
          { name: 'database tests', duration: 5000, passed: 20, failed: 0 }
        ],
        totalDuration: 8500
      };

      const result = await validator.analyzeTestPerformance(testSuite);

      expect(result).toBeDefined();
      expect(result.performanceScore).toBeGreaterThan(0.6);
      expect(result.slowTests.length).toBeGreaterThanOrEqual(1);
      expect(result.recommendations).toBeDefined();
    });
  });

  describe('コード品質評価', () => {
    it('複雑度を測定すること', async () => {
      const complexCode = {
        files: [
          {
            path: 'src/complex.js',
            content: `
              function complexFunction(a, b, c, d, e) {
                if (a > 0) {
                  if (b > 0) {
                    if (c > 0) {
                      for (let i = 0; i < 10; i++) {
                        if (d > i) {
                          if (e % 2 === 0) {
                            return a + b + c + d + e;
                          }
                        }
                      }
                    }
                  }
                }
                return 0;
              }
            `
          }
        ]
      };

      const result = await validator.analyzeCodeComplexity(complexCode);

      expect(result).toBeDefined();
      expect(result.averageComplexity).toBeGreaterThan(5);
      expect(result.complexFunctions.length).toBeGreaterThan(0);
      expect(result.complexityScore).toBeLessThan(0.7);
    });

    it('コーディング規約遵守度を検証すること', async () => {
      const codeWithIssues = {
        files: [
          {
            path: 'src/style.js',
            content: `
              var user_name = "john"; // var使用、命名規約違反
              function getUserData(){  // スペース不足
                  return user_name;   // インデント不整合
              }
            `
          }
        ],
        eslintConfig: {
          rules: {
            'no-var': 'error',
            'camelcase': 'error',
            'indent': ['error', 2]
          }
        }
      };

      const result = await validator.validateCodingStandards(codeWithIssues);

      expect(result).toBeDefined();
      expect(result.violations.length).toBeGreaterThan(0);
      expect(result.complianceScore).toBeLessThan(0.8);
    });
  });

  describe('フレームワーク固有検証', () => {
    it('Express.js プロジェクトの検証を行うこと', async () => {
      const expressProject = {
        framework: 'express',
        files: [
          {
            path: 'app.js',
            content: `
              const express = require('express');
              const app = express();
              
              app.use(express.json());
              
              app.get('/api/users/:id', (req, res) => {
                const userId = req.params.id;
                // SQL injection vulnerability
                const query = "SELECT * FROM users WHERE id = " + userId;
                database.query(query, (err, result) => {
                  res.json(result);
                });
              });
              
              app.listen(3000);
            `
          }
        ]
      };

      const result = await validator.validateExpressProject(expressProject);

      expect(result).toBeDefined();
      expect(result.securityMiddleware.length).toBeGreaterThan(0);
      expect(result.routingSecurity.issues.length).toBeGreaterThan(0);
      expect(result.errorHandling.present).toBe(false);
    });

    it('React プロジェクトの検証を行うこと', async () => {
      const reactProject = {
        framework: 'react',
        files: [
          {
            path: 'src/App.js',
            content: `
              import React, { useState } from 'react';
              
              function App() {
                const [userInput, setUserInput] = useState('');
                
                return (
                  <div>
                    <div dangerouslySetInnerHTML={{__html: userInput}} />
                  </div>
                );
              }
            `
          }
        ]
      };

      const result = await validator.validateReactProject(reactProject);

      expect(result).toBeDefined();
      expect(result.xssVulnerabilities.length).toBeGreaterThan(0);
      expect(result.componentSecurity.issues.length).toBeGreaterThan(0);
    });
  });

  describe('スケーラビリティ検証', () => {
    it('大規模プロジェクトでのスケーラビリティを検証すること', async () => {
      const largeProject = {
        fileCount: 1500,
        totalLinesOfCode: 150000,
        dependencies: 50,
        contributors: 20
      };

      const result = await validator.validateScalability(largeProject);

      expect(result).toBeDefined();
      expect(result.scalabilityScore).toBeGreaterThan(0.6);
      expect(result.bottlenecks.length).toBeGreaterThanOrEqual(0);
      expect(result.recommendations.length).toBeGreaterThan(0);
    });

    it('モジュール分割の品質を評価すること', async () => {
      const projectStructure = {
        modules: [
          { name: 'auth', fileCount: 5, dependencies: ['crypto', 'jwt'] },
          { name: 'user', fileCount: 8, dependencies: ['auth', 'database'] },
          { name: 'database', fileCount: 3, dependencies: ['mongoose'] },
          { name: 'utils', fileCount: 10, dependencies: [] }
        ]
      };

      const result = await validator.analyzeModularization(projectStructure);

      expect(result).toBeDefined();
      expect(result.modularityScore).toBeGreaterThan(0.7);
      expect(result.coupling).toBeLessThan(0.5);
      expect(result.cohesion).toBeGreaterThan(0.6);
    });
  });

  describe('パフォーマンス分析', () => {
    it('ビルド時間を分析すること', async () => {
      const buildMetrics = {
        totalBuildTime: 45000, // 45秒
        stages: [
          { name: 'compile', duration: 20000 },
          { name: 'test', duration: 15000 },
          { name: 'bundle', duration: 10000 }
        ],
        cacheHitRate: 0.75
      };

      const result = await validator.analyzeBuildPerformance(buildMetrics);

      expect(result).toBeDefined();
      expect(result.performanceScore).toBeGreaterThan(0.6);
      expect(result.optimizationSuggestions.length).toBeGreaterThan(0);
    });

    it('実行時パフォーマンスを検証すること', async () => {
      const runtimeMetrics = {
        startupTime: 2500, // 2.5秒
        memoryUsage: 150 * 1024 * 1024, // 150MB
        cpuUsage: 25, // 25%
        responseTime: 150 // 150ms
      };

      const result = await validator.analyzeRuntimePerformance(runtimeMetrics);

      expect(result).toBeDefined();
      expect(result.performanceGrade).toBeDefined();
      expect(result.benchmarkComparison).toBeDefined();
    });
  });

  describe('継続的インテグレーション', () => {
    it('CI/CD パイプライン設定を検証すること', async () => {
      const ciConfig = {
        provider: 'github-actions',
        config: {
          'name': 'CI',
          'on': ['push', 'pull_request'],
          'jobs': {
            'test': {
              'runs-on': 'ubuntu-latest',
              'steps': [
                { 'uses': 'actions/checkout@v2' },
                { 'uses': 'actions/setup-node@v2' },
                { 'run': 'npm ci' },
                { 'run': 'npm test' }
              ]
            }
          }
        }
      };

      const result = await validator.validateCICD(ciConfig);

      expect(result).toBeDefined();
      expect(result.securityChecks.present).toBe(false);
      expect(result.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('レポート生成', () => {
    it('包括的なプロジェクト評価レポートを生成すること', async () => {
      const project = {
        name: 'sample-project',
        version: '1.0.0',
        type: 'node',
        structure: {
          'src/': ['index.js', 'utils.js'],
          'test/': ['index.test.js']
        }
      };

      const fullReport = await validator.generateComprehensiveReport(project);

      expect(fullReport).toBeDefined();
      expect(fullReport.summary).toBeDefined();
      expect(fullReport.securityAnalysis).toBeDefined();
      expect(fullReport.testQualityAnalysis).toBeDefined();
      expect(fullReport.codeQualityAnalysis).toBeDefined();
      expect(fullReport.performanceAnalysis).toBeDefined();
      expect(fullReport.recommendations).toBeDefined();
      expect(fullReport.actionPlan).toBeDefined();
    });

    it('比較レポートを生成すること', async () => {
      const previousReport = {
        timestamp: Date.now() - 7 * 24 * 60 * 60 * 1000,
        scores: {
          security: 0.7,
          testQuality: 0.8,
          codeQuality: 0.75
        }
      };

      const currentReport = {
        timestamp: Date.now(),
        scores: {
          security: 0.85,
          testQuality: 0.82,
          codeQuality: 0.78
        }
      };

      const comparison = validator.generateComparisonReport(previousReport, currentReport);

      expect(comparison).toBeDefined();
      expect(comparison.improvements.length).toBeGreaterThan(0);
      expect(comparison.trends).toBeDefined();
      expect(comparison.overallProgress).toBeGreaterThan(0);
    });
  });

  describe('カスタムルール', () => {
    it('プロジェクト固有のルールを適用できること', async () => {
      const customRules = [
        {
          id: 'company-naming-convention',
          pattern: /^[A-Z][a-zA-Z0-9]*$/,
          applies: 'function-names',
          severity: 'warning'
        },
        {
          id: 'required-comments',
          pattern: /\/\*\*[\s\S]*\*\//,
          applies: 'exported-functions',
          severity: 'error'
        }
      ];

      validator.addCustomRules(customRules);

      const project = {
        files: [
          {
            path: 'src/test.js',
            content: `
              function badlyNamedFunction() { // 命名規約違反
                return 'test';
              }
              
              // コメントなしのエクスポート関数
              module.exports = function() {
                return 'exported';
              };
            `
          }
        ]
      };

      const result = await validator.validateWithCustomRules(project);

      expect(result).toBeDefined();
      expect(result.customRuleViolations.length).toBeGreaterThan(0);
    });
  });

  describe('エラーハンドリング', () => {
    it('破損したプロジェクトファイルを適切に処理すること', async () => {
      const corruptedProject = {
        files: [
          {
            path: 'src/broken.js',
            content: 'function broken() { syntax error here'
          }
        ]
      };

      expect(async () => {
        const result = await validator.validateProject(corruptedProject);
        expect(result).toBeDefined();
        expect(result.parsingErrors.length).toBeGreaterThan(0);
      }).not.toThrow();
    });

    it('存在しないファイルパスを適切に処理すること', async () => {
      const projectWithMissingFiles = {
        files: [
          { path: 'src/missing.js', content: null }
        ]
      };

      const result = await validator.validateProject(projectWithMissingFiles);

      expect(result).toBeDefined();
      expect(result.missingFiles.length).toBeGreaterThan(0);
    });

    it('リソース制限時のグレースフルな処理を行うこと', async () => {
      const veryLargeProject = {
        fileCount: 50000,
        totalLinesOfCode: 5000000
      };

      // メモリ制限を設定
      validator.setResourceLimits({
        maxMemory: 100 * 1024 * 1024, // 100MB
        maxExecutionTime: 30000 // 30秒
      });

      const result = await validator.validateProject(veryLargeProject);

      expect(result).toBeDefined();
      if (result.truncated) {
        expect(result.truncatedReason).toBeDefined();
      }
    });
  });
});