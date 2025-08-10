import { ProjectStructure } from '../types';

/**
 * デザインパターン検出結果
 */
export interface DesignPattern {
  type: string;
  confidence: number;
  location: string;
  description?: string;
}

/**
 * アンチパターン検出結果
 */
export interface AntiPattern {
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  location: string;
  recommendation: string;
  description?: string;
}

/**
 * パターン分析レポート
 */
export interface PatternAnalysis {
  designPatterns: DesignPattern[];
  antiPatterns: AntiPattern[];
  recommendations: PatternRecommendation[];
  score: number;
}

/**
 * パターン改善推奨事項
 */
export interface PatternRecommendation {
  pattern: string;
  action: string;
  priority: 'low' | 'medium' | 'high';
  estimatedEffort?: string;
}

/**
 * パターンレポート
 */
export interface PatternReport {
  summary: {
    totalDesignPatterns: number;
    totalAntiPatterns: number;
    overallScore: number;
    grade: string;
  };
  designPatterns: DesignPattern[];
  antiPatterns: AntiPattern[];
  recommendations: PatternRecommendation[];
  metrics: {
    patternDiversity: number;
    antiPatternSeverity: number;
  };
}

/**
 * デザインパターン・アンチパターン検出器
 * SOLID原則、DRY原則、KISS原則に基づいた実装
 */
export class PatternDetector {
  // デザインパターンの検出パターン
  private readonly DESIGN_PATTERNS = {
    Singleton: {
      indicators: ['private static instance', 'getInstance', 'private constructor'],
      confidence: 0.9
    },
    Factory: {
      indicators: ['Factory', 'create', 'switch', 'case', 'return new'],
      confidence: 0.8
    },
    Observer: {
      indicators: ['listeners', 'on(', 'emit(', 'subscribe', 'notify', 'observers'],
      confidence: 0.85
    },
    Strategy: {
      indicators: ['Strategy', 'algorithm', 'execute', 'interface', 'implements'],
      confidence: 0.75
    },
    Builder: {
      indicators: ['Builder', 'build(', 'with', 'set', 'return this'],
      confidence: 0.8
    },
    Decorator: {
      indicators: ['Decorator', 'wrapper', 'extends', 'super(', 'enhance'],
      confidence: 0.75
    }
  };

  // アンチパターンの検出パターン
  private readonly ANTI_PATTERNS = {
    'God Object': {
      indicators: {
        methodCount: 20,
        propertyCount: 15,
        responsibilities: 5
      },
      severity: 'high' as const
    },
    'Spaghetti Code': {
      indicators: {
        maxNestingLevel: 5,
        cyclomaticComplexity: 20
      },
      severity: 'medium' as const
    },
    'Copy-Paste Programming': {
      indicators: {
        duplicateThreshold: 0.7,
        minLines: 5
      },
      severity: 'medium' as const
    },
    'Magic Numbers': {
      indicators: {
        pattern: /(?<![\w])(?:[1-9]\d{2,}|[2-9]\d)(?![\w])/g
      },
      severity: 'low' as const
    },
    'Dead Code': {
      indicators: {
        unusedPattern: /^\s*\/\/.*$|^\s*\/\*[\s\S]*?\*\//gm
      },
      severity: 'low' as const
    }
  };

  /**
   * デザインパターンを検出
   */
  detectDesignPatterns(fileContent: string, fileName: string): DesignPattern[] {
    const patterns: DesignPattern[] = [];

    try {
      // Singleton パターン検出
      if (this.isSingletonPattern(fileContent)) {
        patterns.push({
          type: 'Singleton',
          confidence: this.DESIGN_PATTERNS.Singleton.confidence,
          location: fileName,
          description: 'Singleton pattern ensures only one instance of a class exists'
        });
      }

      // Factory パターン検出
      if (this.isFactoryPattern(fileContent)) {
        patterns.push({
          type: 'Factory',
          confidence: this.DESIGN_PATTERNS.Factory.confidence,
          location: fileName,
          description: 'Factory pattern provides an interface for creating objects'
        });
      }

      // Observer パターン検出
      if (this.isObserverPattern(fileContent)) {
        patterns.push({
          type: 'Observer',
          confidence: this.DESIGN_PATTERNS.Observer.confidence,
          location: fileName,
          description: 'Observer pattern defines a one-to-many dependency between objects'
        });
      }

      // Strategy パターン検出
      if (this.isStrategyPattern(fileContent)) {
        patterns.push({
          type: 'Strategy',
          confidence: this.DESIGN_PATTERNS.Strategy.confidence,
          location: fileName,
          description: 'Strategy pattern defines a family of algorithms'
        });
      }

      // Builder パターン検出
      if (this.isBuilderPattern(fileContent)) {
        patterns.push({
          type: 'Builder',
          confidence: this.DESIGN_PATTERNS.Builder.confidence,
          location: fileName,
          description: 'Builder pattern separates object construction from representation'
        });
      }

      // Decorator パターン検出
      if (this.isDecoratorPattern(fileContent)) {
        patterns.push({
          type: 'Decorator',
          confidence: this.DESIGN_PATTERNS.Decorator.confidence,
          location: fileName,
          description: 'Decorator pattern adds new functionality to objects dynamically'
        });
      }
    } catch (error) {
      // エラーハンドリング（Defensive Programming）
      console.error(`Error detecting design patterns in ${fileName}:`, error);
    }

    return patterns;
  }

  /**
   * アンチパターンを検出
   */
  detectAntiPatterns(fileContent: string, fileName: string): AntiPattern[] {
    const antiPatterns: AntiPattern[] = [];

    try {
      // God Object検出
      if (this.isGodObject(fileContent)) {
        antiPatterns.push({
          type: 'God Object',
          severity: 'high',
          location: fileName,
          recommendation: 'Consider applying Single Responsibility Principle. Break down the class into smaller, focused classes.',
          description: 'Class has too many responsibilities'
        });
      }

      // Spaghetti Code検出
      if (this.isSpaghettiCode(fileContent)) {
        antiPatterns.push({
          type: 'Spaghetti Code',
          severity: 'medium',
          location: fileName,
          recommendation: 'Consider refactoring deeply nested code. Extract methods and apply early returns.',
          description: 'Code has excessive nesting and complexity'
        });
      }

      // Copy-Paste Programming検出
      if (this.isCopyPasteProgramming(fileContent)) {
        antiPatterns.push({
          type: 'Copy-Paste Programming',
          severity: 'medium',
          location: fileName,
          recommendation: 'Apply DRY principle. Extract common logic into reusable functions or classes.',
          description: 'Duplicate code detected'
        });
      }

      // Magic Numbers検出
      if (this.hasMagicNumbers(fileContent)) {
        antiPatterns.push({
          type: 'Magic Numbers',
          severity: 'low',
          location: fileName,
          recommendation: 'Replace magic numbers with named constants for better readability.',
          description: 'Hardcoded numeric values detected'
        });
      }

      // Dead Code検出
      if (this.hasDeadCode(fileContent)) {
        antiPatterns.push({
          type: 'Dead Code',
          severity: 'low',
          location: fileName,
          recommendation: 'Remove commented or unused code to improve maintainability.',
          description: 'Potentially unused code detected'
        });
      }
    } catch (error) {
      // エラーハンドリング（Defensive Programming）
      console.error(`Error detecting anti-patterns in ${fileName}:`, error);
    }

    return antiPatterns;
  }

  /**
   * プロジェクト全体のパターンを分析
   */
  async analyzeProjectPatterns(projectStructure: ProjectStructure): Promise<PatternAnalysis> {
    const designPatterns: DesignPattern[] = [];
    const antiPatterns: AntiPattern[] = [];

    // プロジェクト構造から推測されるパターンを追加
    if (projectStructure.architecture?.type === 'mvc') {
      designPatterns.push({
        type: 'MVC',
        confidence: projectStructure.architecture.confidence || 0.7,
        location: 'Project Architecture',
        description: 'Model-View-Controller architectural pattern'
      });
    }

    // ディレクトリ構造からFactoryパターンを検出
    const hasFactoryDir = projectStructure.directories?.some(
      dir => dir.path.toLowerCase().includes('factory') || dir.path.toLowerCase().includes('factories')
    );
    if (hasFactoryDir) {
      designPatterns.push({
        type: 'Factory',
        confidence: 0.7,
        location: 'Project Structure',
        description: 'Factory pattern detected from directory structure'
      });
    }

    // メトリクスから問題を検出
    if (projectStructure.metrics) {
      const { complexity, maintainability } = projectStructure.metrics;
      
      if (complexity?.averageCyclomaticComplexity && complexity.averageCyclomaticComplexity > 20) {
        antiPatterns.push({
          type: 'High Complexity',
          severity: 'high',
          location: 'Project',
          recommendation: 'Reduce cyclomatic complexity by extracting methods and simplifying logic.',
          description: `Average cyclomatic complexity: ${complexity.averageCyclomaticComplexity}`
        });
      }

      if (maintainability?.maintainabilityIndex && maintainability.maintainabilityIndex < 50) {
        antiPatterns.push({
          type: 'Low Maintainability',
          severity: 'medium',
          location: 'Project',
          recommendation: 'Improve code maintainability through refactoring and better documentation.',
          description: `Maintainability index: ${maintainability.maintainabilityIndex}`
        });
      }
    }

    // 推奨事項を生成
    const recommendations = this.generateRecommendations(designPatterns, antiPatterns);

    // スコアを計算
    const score = this.calculatePatternScore(designPatterns, antiPatterns);

    return {
      designPatterns,
      antiPatterns,
      recommendations,
      score
    };
  }

  /**
   * パターンレポートを生成
   */
  generatePatternReport(analysis: PatternAnalysis): PatternReport {
    const grade = this.calculateGrade(analysis.score);
    const patternDiversity = this.calculatePatternDiversity(analysis.designPatterns);
    const antiPatternSeverity = this.calculateAntiPatternSeverity(analysis.antiPatterns);

    return {
      summary: {
        totalDesignPatterns: analysis.designPatterns.length,
        totalAntiPatterns: analysis.antiPatterns.length,
        overallScore: analysis.score,
        grade
      },
      designPatterns: analysis.designPatterns,
      antiPatterns: analysis.antiPatterns,
      recommendations: analysis.recommendations,
      metrics: {
        patternDiversity,
        antiPatternSeverity
      }
    };
  }

  // プライベートヘルパーメソッド（KISS原則に従いシンプルに実装）

  private isSingletonPattern(content: string): boolean {
    const indicators = this.DESIGN_PATTERNS.Singleton.indicators;
    return indicators.filter(indicator => 
      content.toLowerCase().includes(indicator.toLowerCase())
    ).length >= 2;
  }

  private isFactoryPattern(content: string): boolean {
    const indicators = this.DESIGN_PATTERNS.Factory.indicators;
    return indicators.filter(indicator => 
      content.toLowerCase().includes(indicator.toLowerCase())
    ).length >= 3;
  }

  private isObserverPattern(content: string): boolean {
    const indicators = this.DESIGN_PATTERNS.Observer.indicators;
    return indicators.filter(indicator => 
      content.toLowerCase().includes(indicator.toLowerCase())
    ).length >= 2;
  }

  private isStrategyPattern(content: string): boolean {
    const indicators = this.DESIGN_PATTERNS.Strategy.indicators;
    return indicators.filter(indicator => 
      content.toLowerCase().includes(indicator.toLowerCase())
    ).length >= 2;
  }

  private isBuilderPattern(content: string): boolean {
    const indicators = this.DESIGN_PATTERNS.Builder.indicators;
    return indicators.filter(indicator => 
      content.toLowerCase().includes(indicator.toLowerCase())
    ).length >= 3;
  }

  private isDecoratorPattern(content: string): boolean {
    const indicators = this.DESIGN_PATTERNS.Decorator.indicators;
    return indicators.filter(indicator => 
      content.toLowerCase().includes(indicator.toLowerCase())
    ).length >= 2;
  }

  private isGodObject(content: string): boolean {
    const methodMatches = content.match(/^\s*(public|private|protected)?\s*\w+\s*\([^)]*\)\s*[:{]/gm);
    const propertyMatches = content.match(/^\s*(public|private|protected)?\s*\w+\s*[:=]/gm);
    
    const methodCount = methodMatches ? methodMatches.length : 0;
    const propertyCount = propertyMatches ? propertyMatches.length : 0;

    return methodCount > this.ANTI_PATTERNS['God Object'].indicators.methodCount ||
           propertyCount > this.ANTI_PATTERNS['God Object'].indicators.propertyCount;
  }

  private isSpaghettiCode(content: string): boolean {
    const nestingLevel = this.calculateMaxNesting(content);
    return nestingLevel > this.ANTI_PATTERNS['Spaghetti Code'].indicators.maxNestingLevel;
  }

  private isCopyPasteProgramming(content: string): boolean {
    const functions = content.match(/function\s+\w+[^{]*{[^}]*}/g) || [];
    
    for (let i = 0; i < functions.length; i++) {
      for (let j = i + 1; j < functions.length; j++) {
        const similarity = this.calculateSimilarity(functions[i], functions[j]);
        if (similarity > this.ANTI_PATTERNS['Copy-Paste Programming'].indicators.duplicateThreshold) {
          return true;
        }
      }
    }
    
    return false;
  }

  private hasMagicNumbers(content: string): boolean {
    const pattern = this.ANTI_PATTERNS['Magic Numbers'].indicators.pattern;
    const matches = content.match(pattern);
    return matches !== null && matches.length > 3;
  }

  private hasDeadCode(content: string): boolean {
    const pattern = this.ANTI_PATTERNS['Dead Code'].indicators.unusedPattern;
    const matches = content.match(pattern);
    return matches !== null && matches.length > 10;
  }

  private calculateMaxNesting(content: string): number {
    let maxNesting = 0;
    let currentNesting = 0;
    
    for (const char of content) {
      if (char === '{') {
        currentNesting++;
        maxNesting = Math.max(maxNesting, currentNesting);
      } else if (char === '}') {
        currentNesting = Math.max(0, currentNesting - 1);
      }
    }
    
    return maxNesting;
  }

  private calculateSimilarity(str1: string, str2: string): number {
    const len1 = str1.length;
    const len2 = str2.length;
    const maxLen = Math.max(len1, len2);
    
    if (maxLen === 0) return 1.0;
    
    // 簡易的なレーベンシュタイン距離の実装
    const distance = this.levenshteinDistance(str1, str2);
    return 1 - (distance / maxLen);
  }

  private levenshteinDistance(str1: string, str2: string): number {
    const matrix: number[][] = [];
    
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }
    
    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }
    
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }
    
    return matrix[str2.length][str1.length];
  }

  private generateRecommendations(
    designPatterns: DesignPattern[],
    antiPatterns: AntiPattern[]
  ): PatternRecommendation[] {
    const recommendations: PatternRecommendation[] = [];

    // アンチパターンに基づく推奨事項
    antiPatterns.forEach(antiPattern => {
      let priority: 'low' | 'medium' | 'high' = 'low';
      if (antiPattern.severity === 'critical' || antiPattern.severity === 'high') {
        priority = 'high';
      } else if (antiPattern.severity === 'medium') {
        priority = 'medium';
      }

      recommendations.push({
        pattern: antiPattern.type,
        action: antiPattern.recommendation,
        priority,
        estimatedEffort: this.estimateEffort(antiPattern)
      });
    });

    // デザインパターンの改善提案
    if (designPatterns.length === 0) {
      recommendations.push({
        pattern: 'Design Patterns',
        action: 'Consider implementing common design patterns to improve code structure and maintainability.',
        priority: 'low',
        estimatedEffort: 'Medium'
      });
    }

    // 推奨事項を優先度でソート
    recommendations.sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });

    return recommendations;
  }

  private estimateEffort(antiPattern: AntiPattern): string {
    switch (antiPattern.severity) {
      case 'critical':
        return 'High';
      case 'high':
        return 'Medium-High';
      case 'medium':
        return 'Medium';
      case 'low':
        return 'Low';
      default:
        return 'Unknown';
    }
  }

  private calculatePatternScore(
    designPatterns: DesignPattern[],
    antiPatterns: AntiPattern[]
  ): number {
    let score = 100;

    // アンチパターンによる減点
    antiPatterns.forEach(antiPattern => {
      switch (antiPattern.severity) {
        case 'critical':
          score -= 20;
          break;
        case 'high':
          score -= 15;
          break;
        case 'medium':
          score -= 10;
          break;
        case 'low':
          score -= 5;
          break;
      }
    });

    // デザインパターンによる加点
    designPatterns.forEach(pattern => {
      score += pattern.confidence * 5;
    });

    // スコアを0-100の範囲に制限
    return Math.max(0, Math.min(100, score));
  }

  private calculateGrade(score: number): string {
    if (score >= 90) return 'A';
    if (score >= 80) return 'B';
    if (score >= 70) return 'C';
    if (score >= 60) return 'D';
    if (score >= 50) return 'E';
    return 'F';
  }

  private calculatePatternDiversity(patterns: DesignPattern[]): number {
    const uniqueTypes = new Set(patterns.map(p => p.type));
    return uniqueTypes.size / Math.max(1, patterns.length);
  }

  private calculateAntiPatternSeverity(antiPatterns: AntiPattern[]): number {
    if (antiPatterns.length === 0) return 0;

    const severityScores = {
      critical: 4,
      high: 3,
      medium: 2,
      low: 1
    };

    const totalSeverity = antiPatterns.reduce(
      (sum, ap) => sum + severityScores[ap.severity],
      0
    );

    return totalSeverity / antiPatterns.length;
  }
}