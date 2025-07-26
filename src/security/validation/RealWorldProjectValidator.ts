/**
 * 実世界プロジェクト検証システム
 * TaintTyperベース型解析の実世界フレームワーク（Express.js/React/NestJS）での検証
 */

import {
  TestCase,
  SecurityIssue,
  SecurityTestMetrics,
  MethodAnalysisResult
} from '../types';
import { TypeBasedSecurityEngine } from '../analysis/engine';
import { PerformanceBenchmark } from '../benchmarks/PerformanceBenchmark';
import * as fs from 'fs/promises';
import * as path from 'path';

/**
 * 実世界プロジェクト情報
 */
export interface RealWorldProject {
  /** プロジェクト名 */
  name: string;
  /** フレームワーク種別 */
  framework: 'express' | 'react' | 'nestjs' | 'nextjs' | 'fastify';
  /** プロジェクトルートパス */
  rootPath: string;
  /** テストディレクトリパス */
  testPaths: string[];
  /** 期待される検証結果 */
  expectedFindings: {
    securityIssues: number;
    coverageScore: number;
    expectedPatterns: string[];
  };
  /** メタデータ */
  metadata: {
    description: string;
    complexity: 'small' | 'medium' | 'large' | 'enterprise';
    testCount: number;
    lastValidated: Date;
  };
}

/**
 * 検証結果
 */
export interface ValidationResult {
  /** プロジェクト情報 */
  project: RealWorldProject;
  /** 解析結果 */
  analysisResults: MethodAnalysisResult[];
  /** パフォーマンス測定 */
  performanceMetrics: {
    totalTime: number;
    timePerFile: number;
    memoryUsage: number;
    throughput: number;
  };
  /** 精度評価 */
  accuracyMetrics: {
    detectedIssues: number;
    falsePositives: number;
    falseNegatives: number;
    precision: number;
    recall: number;
    f1Score: number;
  };
  /** セキュリティ評価 */
  securityAssessment: {
    overallScore: number;
    criticalIssues: number;
    highIssues: number;
    mediumIssues: number;
    lowIssues: number;
    coverageByCategory: {
      authentication: number;
      inputValidation: number;
      authorization: number;
      dataProtection: number;
    };
  };
  /** フレームワーク固有の評価 */
  frameworkSpecificFindings: FrameworkSpecificFinding[];
}

/**
 * フレームワーク固有の発見事項
 */
export interface FrameworkSpecificFinding {
  /** フレームワーク */
  framework: string;
  /** カテゴリ */
  category: string;
  /** 発見事項 */
  finding: string;
  /** 重要度 */
  severity: 'low' | 'medium' | 'high' | 'critical';
  /** 推奨対策 */
  recommendation: string;
}

/**
 * 実世界プロジェクト検証システム
 */
export class RealWorldProjectValidator {
  private securityEngine: TypeBasedSecurityEngine;
  private benchmark: PerformanceBenchmark;
  private validatedProjects: Map<string, ValidationResult> = new Map();

  constructor() {
    this.securityEngine = new TypeBasedSecurityEngine({
      strictness: 'moderate',
      enableCache: true,
      parallelism: Math.max(1, Math.floor(require('os').cpus().length * 0.8))
    });
    this.benchmark = new PerformanceBenchmark();
  }

  /**
   * 複数プロジェクトの包括的検証
   */
  async validateMultipleProjects(projects: RealWorldProject[]): Promise<ValidationResult[]> {
    console.log('🌐 実世界プロジェクト包括検証開始');
    console.log(`対象: ${projects.length}プロジェクト (${projects.map(p => p.framework).join(', ')})`);
    console.log('');

    const results: ValidationResult[] = [];

    for (const project of projects) {
      console.log(`📁 ${project.name} (${project.framework}) 検証中...`);
      
      try {
        const result = await this.validateProject(project);
        results.push(result);
        
        console.log(`   ✅ 完了: ${result.accuracyMetrics.detectedIssues}件検出, ` +
                   `精度${(result.accuracyMetrics.precision * 100).toFixed(1)}%, ` +
                   `${result.performanceMetrics.timePerFile.toFixed(2)}ms/file`);
      } catch (error) {
        console.error(`   ❌ ${project.name} 検証エラー:`, error);
      }
      
      console.log('');
    }

    // 結果の保存
    await this.saveValidationResults(results);

    return results;
  }

  /**
   * 単一プロジェクトの検証
   */
  async validateProject(project: RealWorldProject): Promise<ValidationResult> {
    const startTime = Date.now();

    // Step 1: テストファイルの収集
    const testCases = await this.collectTestCases(project);
    
    // Step 2: セキュリティ解析の実行
    const analysisResults = await this.runSecurityAnalysis(testCases);
    
    // Step 3: パフォーマンス測定
    const performanceMetrics = await this.measurePerformance(testCases);
    
    // Step 4: 精度評価
    const accuracyMetrics = await this.evaluateAccuracy(analysisResults, project.expectedFindings);
    
    // Step 5: セキュリティ評価
    const securityAssessment = this.assessSecurity(analysisResults);
    
    // Step 6: フレームワーク固有評価
    const frameworkSpecificFindings = await this.analyzeFrameworkSpecific(project, analysisResults);

    const result: ValidationResult = {
      project,
      analysisResults,
      performanceMetrics,
      accuracyMetrics,
      securityAssessment,
      frameworkSpecificFindings
    };

    // 結果をキャッシュ
    this.validatedProjects.set(project.name, result);

    return result;
  }

  /**
   * Express.jsプロジェクトの検証
   */
  async validateExpressProject(projectPath: string): Promise<ValidationResult> {
    const expressProject: RealWorldProject = {
      name: 'Express.js Validation Project',
      framework: 'express',
      rootPath: projectPath,
      testPaths: [
        path.join(projectPath, 'test'),
        path.join(projectPath, '__tests__'),
        path.join(projectPath, 'tests')
      ],
      expectedFindings: {
        securityIssues: 15,
        coverageScore: 70,
        expectedPatterns: [
          'sql-injection-test',
          'xss-prevention-test',
          'auth-middleware-test',
          'rate-limiting-test'
        ]
      },
      metadata: {
        description: 'Express.js RESTful API with authentication and validation',
        complexity: 'medium',
        testCount: 50,
        lastValidated: new Date()
      }
    };

    return this.validateProject(expressProject);
  }

  /**
   * Reactプロジェクトの検証
   */
  async validateReactProject(projectPath: string): Promise<ValidationResult> {
    const reactProject: RealWorldProject = {
      name: 'React Frontend Security Project',
      framework: 'react',
      rootPath: projectPath,
      testPaths: [
        path.join(projectPath, 'src/__tests__'),
        path.join(projectPath, 'tests'),
        path.join(projectPath, 'src/**/*.test.tsx')
      ],
      expectedFindings: {
        securityIssues: 10,
        coverageScore: 80,
        expectedPatterns: [
          'xss-prevention-test',
          'csrf-protection-test',
          'input-sanitization-test',
          'auth-state-test'
        ]
      },
      metadata: {
        description: 'React SPA with authentication and form validation',
        complexity: 'medium',
        testCount: 35,
        lastValidated: new Date()
      }
    };

    return this.validateProject(reactProject);
  }

  /**
   * NestJSプロジェクトの検証
   */
  async validateNestJSProject(projectPath: string): Promise<ValidationResult> {
    const nestjsProject: RealWorldProject = {
      name: 'NestJS Enterprise API Project',
      framework: 'nestjs',
      rootPath: projectPath,
      testPaths: [
        path.join(projectPath, 'test'),
        path.join(projectPath, 'src/**/*.spec.ts'),
        path.join(projectPath, 'e2e')
      ],
      expectedFindings: {
        securityIssues: 20,
        coverageScore: 85,
        expectedPatterns: [
          'guard-authorization-test',
          'dto-validation-test',
          'jwt-security-test',
          'rate-limiting-test',
          'cors-configuration-test'
        ]
      },
      metadata: {
        description: 'NestJS enterprise API with microservices architecture',
        complexity: 'large',
        testCount: 120,
        lastValidated: new Date()
      }
    };

    return this.validateProject(nestjsProject);
  }

  /**
   * テストケースの収集
   */
  private async collectTestCases(project: RealWorldProject): Promise<TestCase[]> {
    const testCases: TestCase[] = [];

    for (const testPath of project.testPaths) {
      try {
        await fs.access(testPath);
        const files = await this.findTestFiles(testPath);
        
        for (const file of files) {
          const content = await fs.readFile(file, 'utf-8');
          testCases.push({
            name: path.basename(file, path.extname(file)),
            file,
            content,
            metadata: {
              framework: project.framework,
              language: file.endsWith('.ts') ? 'typescript' : 'javascript',
              lastModified: (await fs.stat(file)).mtime
            }
          });
        }
      } catch (error) {
        // ディレクトリが存在しない場合はスキップ
        continue;
      }
    }

    return testCases;
  }

  /**
   * テストファイルの検索
   */
  private async findTestFiles(dirPath: string): Promise<string[]> {
    const files: string[] = [];
    
    try {
      const entries = await fs.readdir(dirPath, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name);
        
        if (entry.isDirectory()) {
          // 再帰的に検索
          const subFiles = await this.findTestFiles(fullPath);
          files.push(...subFiles);
        } else if (this.isTestFile(entry.name)) {
          files.push(fullPath);
        }
      }
    } catch (error) {
      // ディレクトリアクセスエラーは無視
    }
    
    return files;
  }

  /**
   * テストファイル判定
   */
  private isTestFile(filename: string): boolean {
    const testPatterns = [
      /\.test\.(js|ts|jsx|tsx)$/,
      /\.spec\.(js|ts|jsx|tsx)$/,
      /-test\.(js|ts|jsx|tsx)$/,
      /-spec\.(js|ts|jsx|tsx)$/
    ];
    
    return testPatterns.some(pattern => pattern.test(filename));
  }

  /**
   * セキュリティ解析の実行
   */
  private async runSecurityAnalysis(testCases: TestCase[]): Promise<MethodAnalysisResult[]> {
    const result = await this.securityEngine.analyzeAtCompileTime(testCases);
    
    // 結果をMethodAnalysisResult[]形式に変換
    const methodResults: MethodAnalysisResult[] = [];
    
    testCases.forEach((testCase, index) => {
      const issues = result.issues.filter(issue => issue.location.file === testCase.file);
      
      methodResults.push({
        methodName: testCase.name,
        issues,
        metrics: {
          securityCoverage: {
            authentication: this.calculateCoverage(issues, 'authentication'),
            inputValidation: this.calculateCoverage(issues, 'inputValidation'),
            apiSecurity: this.calculateCoverage(issues, 'apiSecurity'),
            overall: this.calculateOverallCoverage(issues)
          },
          taintFlowDetection: this.calculateTaintFlowScore(issues),
          sanitizerCoverage: this.calculateSanitizerCoverage(issues),
          invariantCompliance: this.calculateInvariantCompliance(issues)
        },
        suggestions: this.generateSuggestions(issues),
        analysisTime: result.executionTime / testCases.length
      });
    });
    
    return methodResults;
  }

  /**
   * パフォーマンス測定
   */
  private async measurePerformance(testCases: TestCase[]): Promise<{
    totalTime: number;
    timePerFile: number;
    memoryUsage: number;
    throughput: number;
  }> {
    const startTime = Date.now();
    const initialMemory = process.memoryUsage().heapUsed;

    // ベンチマークシステムを使用して測定
    const target5msAchieved = await this.benchmark.verify5msPerFileTarget(testCases);
    const speedupRatio = await this.benchmark.verifySpeedupTarget(testCases);

    const endTime = Date.now();
    const finalMemory = process.memoryUsage().heapUsed;
    
    const totalTime = endTime - startTime;
    const memoryUsage = Math.max(0, (finalMemory - initialMemory) / 1024 / 1024); // MB

    return {
      totalTime,
      timePerFile: testCases.length > 0 ? totalTime / testCases.length : 0,
      memoryUsage,
      throughput: testCases.length > 0 ? (testCases.length / totalTime) * 1000 : 0
    };
  }

  /**
   * 精度評価
   */
  private async evaluateAccuracy(
    results: MethodAnalysisResult[],
    expectedFindings: RealWorldProject['expectedFindings']
  ): Promise<{
    detectedIssues: number;
    falsePositives: number;
    falseNegatives: number;
    precision: number;
    recall: number;
    f1Score: number;
  }> {
    const detectedIssues = results.reduce((sum, result) => sum + result.issues.length, 0);
    
    // 簡易的な精度計算（実際の実装では詳細な比較が必要）
    const expectedIssues = expectedFindings.securityIssues;
    const truePositives = Math.min(detectedIssues, expectedIssues);
    const falsePositives = Math.max(0, detectedIssues - expectedIssues);
    const falseNegatives = Math.max(0, expectedIssues - detectedIssues);
    
    const precision = detectedIssues > 0 ? truePositives / detectedIssues : 0;
    const recall = expectedIssues > 0 ? truePositives / expectedIssues : 0;
    const f1Score = (precision + recall) > 0 ? 2 * (precision * recall) / (precision + recall) : 0;

    return {
      detectedIssues,
      falsePositives,
      falseNegatives,
      precision,
      recall,
      f1Score
    };
  }

  /**
   * セキュリティ評価
   */
  private assessSecurity(results: MethodAnalysisResult[]): {
    overallScore: number;
    criticalIssues: number;
    highIssues: number;
    mediumIssues: number;
    lowIssues: number;
    coverageByCategory: {
      authentication: number;
      inputValidation: number;
      authorization: number;
      dataProtection: number;
    };
  } {
    let criticalIssues = 0;
    let highIssues = 0;
    let mediumIssues = 0;
    let lowIssues = 0;

    let authSum = 0;
    let inputSum = 0;
    let authzSum = 0;
    let dataSum = 0;

    results.forEach(result => {
      result.issues.forEach(issue => {
        switch (issue.severity) {
          case 'error': criticalIssues++; break;
          case 'warning': highIssues++; break;
          default: mediumIssues++; break;
        }
      });

      authSum += result.metrics.securityCoverage.authentication;
      inputSum += result.metrics.securityCoverage.inputValidation;
      // 認可とデータ保護は推定値
      authzSum += result.metrics.securityCoverage.authentication * 0.8;
      dataSum += result.metrics.securityCoverage.inputValidation * 0.7;
    });

    const count = results.length;
    const totalIssues = criticalIssues + highIssues + mediumIssues + lowIssues;
    const overallScore = Math.max(0, 100 - (criticalIssues * 10 + highIssues * 5 + mediumIssues * 2));

    return {
      overallScore,
      criticalIssues,
      highIssues,
      mediumIssues,
      lowIssues,
      coverageByCategory: {
        authentication: count > 0 ? authSum / count : 0,
        inputValidation: count > 0 ? inputSum / count : 0,
        authorization: count > 0 ? authzSum / count : 0,
        dataProtection: count > 0 ? dataSum / count : 0
      }
    };
  }

  /**
   * フレームワーク固有の分析
   */
  private async analyzeFrameworkSpecific(
    project: RealWorldProject,
    results: MethodAnalysisResult[]
  ): Promise<FrameworkSpecificFinding[]> {
    const findings: FrameworkSpecificFinding[] = [];

    switch (project.framework) {
      case 'express':
        findings.push(...this.analyzeExpressSpecific(results));
        break;
      case 'react':
        findings.push(...this.analyzeReactSpecific(results));
        break;
      case 'nestjs':
        findings.push(...this.analyzeNestJSSpecific(results));
        break;
    }

    return findings;
  }

  /**
   * Express.js固有の分析
   */
  private analyzeExpressSpecific(results: MethodAnalysisResult[]): FrameworkSpecificFinding[] {
    const findings: FrameworkSpecificFinding[] = [];

    // ミドルウェアセキュリティのチェック
    const hasMiddlewareTests = results.some(r => 
      r.methodName.includes('middleware') || 
      r.issues.some(i => i.message.includes('middleware'))
    );

    if (!hasMiddlewareTests) {
      findings.push({
        framework: 'Express.js',
        category: 'middleware',
        finding: 'ミドルウェアのセキュリティテストが不足しています',
        severity: 'high',
        recommendation: 'authentication, authorization, rate limiting等のミドルウェアテストを追加してください'
      });
    }

    return findings;
  }

  /**
   * React固有の分析
   */
  private analyzeReactSpecific(results: MethodAnalysisResult[]): FrameworkSpecificFinding[] {
    const findings: FrameworkSpecificFinding[] = [];

    // XSS対策のチェック
    const hasXSSTests = results.some(r => 
      r.issues.some(i => i.message.toLowerCase().includes('xss') || i.message.includes('script'))
    );

    if (!hasXSSTests) {
      findings.push({
        framework: 'React',
        category: 'xss-prevention',
        finding: 'XSS対策のテストが不足しています',
        severity: 'critical',
        recommendation: 'dangerouslySetInnerHTML使用時のサニタイズテストを追加してください'
      });
    }

    return findings;
  }

  /**
   * NestJS固有の分析
   */
  private analyzeNestJSSpecific(results: MethodAnalysisResult[]): FrameworkSpecificFinding[] {
    const findings: FrameworkSpecificFinding[] = [];

    // Guard/Interceptorのテストチェック
    const hasGuardTests = results.some(r => 
      r.methodName.includes('guard') || r.methodName.includes('interceptor')
    );

    if (!hasGuardTests) {
      findings.push({
        framework: 'NestJS',
        category: 'guards-interceptors',
        finding: 'Guard/Interceptorのセキュリティテストが不足しています',
        severity: 'high',
        recommendation: 'AuthGuard, RolesGuard等のセキュリティコンポーネントのテストを追加してください'
      });
    }

    return findings;
  }

  /**
   * 検証結果の保存
   */
  private async saveValidationResults(results: ValidationResult[]): Promise<void> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const reportPath = path.join(process.cwd(), `real-world-validation-${timestamp}.json`);
    
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        totalProjects: results.length,
        frameworks: [...new Set(results.map(r => r.project.framework))],
        overallAccuracy: this.calculateOverallAccuracy(results),
        averagePerformance: this.calculateAveragePerformance(results)
      },
      results
    };

    await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
    console.log(`📄 検証結果を保存しました: ${reportPath}`);
  }

  // ヘルパーメソッド群
  private calculateCoverage(issues: SecurityIssue[], category: string): number {
    const categoryIssues = issues.filter(issue => 
      issue.message.toLowerCase().includes(category.toLowerCase())
    );
    return Math.min(100, categoryIssues.length * 20);
  }

  private calculateOverallCoverage(issues: SecurityIssue[]): number {
    return Math.min(100, issues.length * 10);
  }

  private calculateTaintFlowScore(issues: SecurityIssue[]): number {
    const taintIssues = issues.filter(issue => 
      issue.type === 'unsafe-taint-flow' || issue.message.includes('taint')
    );
    return taintIssues.length === 0 ? 1.0 : 0.7;
  }

  private calculateSanitizerCoverage(issues: SecurityIssue[]): number {
    const sanitizerIssues = issues.filter(issue => 
      issue.type === 'missing-sanitizer' || issue.message.includes('sanitizer')
    );
    return sanitizerIssues.length === 0 ? 1.0 : 0.6;
  }

  private calculateInvariantCompliance(issues: SecurityIssue[]): number {
    const criticalIssues = issues.filter(issue => issue.severity === 'error');
    return criticalIssues.length === 0 ? 1.0 : 0.5;
  }

  private generateSuggestions(issues: SecurityIssue[]): any[] {
    return issues.map(issue => ({
      id: `fix-${issue.id}`,
      priority: issue.severity === 'error' ? 'critical' : 'high',
      type: 'security-fix',
      title: `修正: ${issue.type}`,
      description: issue.message,
      location: issue.location,
      estimatedImpact: { securityImprovement: 20, implementationMinutes: 15 },
      automatable: false
    }));
  }

  private calculateOverallAccuracy(results: ValidationResult[]): number {
    if (results.length === 0) return 0;
    const totalF1 = results.reduce((sum, r) => sum + r.accuracyMetrics.f1Score, 0);
    return totalF1 / results.length;
  }

  private calculateAveragePerformance(results: ValidationResult[]): {
    avgTimePerFile: number;
    avgThroughput: number;
  } {
    if (results.length === 0) return { avgTimePerFile: 0, avgThroughput: 0 };
    
    const totalTimePerFile = results.reduce((sum, r) => sum + r.performanceMetrics.timePerFile, 0);
    const totalThroughput = results.reduce((sum, r) => sum + r.performanceMetrics.throughput, 0);
    
    return {
      avgTimePerFile: totalTimePerFile / results.length,
      avgThroughput: totalThroughput / results.length
    };
  }
}