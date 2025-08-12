import * as fs from 'fs/promises';
import * as path from 'path';
import { IPlugin } from '../core/types';

export interface MigrationPlan {
  pluginName: string;
  migrationSteps: string[];
  estimatedComplexity: 'low' | 'medium' | 'high';
  breakingChanges: string[];
  compatibilityNotes: string[];
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface MigrationReport {
  totalPlugins: number;
  legacyPlugins: number;
  modernPlugins: number;
  migrationEstimate: {
    totalEffort: string;
    estimatedHours: number;
    complexPlugins: number;
  };
  pluginDetails: Array<{
    name: string;
    type: 'legacy' | 'modern';
    complexity: string;
    filePath?: string;
  }>;
}

export interface CompatibilityResult {
  isCompatible: boolean;
  breakingChanges: string[];
  newRequirements: string[];
  suggestions: string[];
}

export class MigrationHelper {
  
  /**
   * レガシープラグインかどうかを判定
   */
  isLegacyPlugin(pluginCode: string): boolean {
    // レガシープラグインの特徴
    const legacyPatterns = [
      /async\s+analyze\s*\([^)]*\)/,  // analyzeメソッドの存在（引数含む）
      /\.name\s*=/,           // nameプロパティ
      /severity\s*:\s*['"](?:error|warning|info|high|medium|low)['"]/  // 旧形式のseverity
    ];

    // 新プラグインの特徴
    const modernPatterns = [
      /implements\s+ITestQualityPlugin/,
      /extends\s+BasePlugin/,
      /detectPatterns\s*\(/,
      /evaluateQuality\s*\(/,
      /suggestImprovements\s*\(/
    ];

    const legacyScore = legacyPatterns.filter(pattern => pattern.test(pluginCode)).length;
    const modernScore = modernPatterns.filter(pattern => pattern.test(pluginCode)).length;

    // レガシーパターンが多く、モダンパターンが少ない場合はレガシー
    return legacyScore >= 2 && modernScore < 2;
  }

  /**
   * ディレクトリ内のプラグインファイルを検索
   */
  async findPluginFiles(directory: string): Promise<string[]> {
    const pluginFiles: string[] = [];
    
    try {
      const files = await fs.readdir(directory, { withFileTypes: true });
      
      for (const file of files) {
        const fullPath = path.join(directory, file.name);
        
        if (file.isDirectory()) {
          // 再帰的に検索
          const subFiles = await this.findPluginFiles(fullPath);
          pluginFiles.push(...subFiles);
        } else if (file.isFile() && /\.(ts|js)$/.test(file.name)) {
          // TypeScript/JavaScriptファイルの内容を確認
          const content = await fs.readFile(fullPath, 'utf-8');
          if (this.looksLikePlugin(content)) {
            pluginFiles.push(fullPath);
          }
        }
      }
    } catch (error) {
      // ディレクトリアクセスエラーは無視
    }

    return pluginFiles;
  }

  /**
   * プラグインらしきコードかどうかを判定
   */
  private looksLikePlugin(code: string): boolean {
    const pluginIndicators = [
      /class\s+\w+Plugin/,
      /name\s*[:=]\s*['"][^'"]+['"]/,
      /async\s+analyze\s*\(/,
      /detectPatterns\s*\(/,
      /module\.exports\s*=.*analyze/
    ];

    return pluginIndicators.some(pattern => pattern.test(code));
  }

  /**
   * レガシープラグインの移行計画を生成
   */
  generateMigrationPlan(pluginCode: string): MigrationPlan {
    const nameMatch = pluginCode.match(/name\s*[:=]\s*['"]([^'"]+)['"]/);
    const pluginName = nameMatch ? nameMatch[1] : 'unknown-plugin';

    const migrationSteps = [
      'Convert to ITestQualityPlugin interface',
      'Implement detectPatterns method',
      'Implement evaluateQuality method',
      'Implement suggestImprovements method',
      'Update return types and error handling',
      'Add metadata and confidence scoring',
      'Test with new plugin manager'
    ];

    const complexity = this.estimateComplexity(pluginCode);
    
    const breakingChanges = [
      'analyze() method replaced with detectPatterns()',
      'Return type changed from Issue[] to DetectionResult[]',
      'New quality evaluation methods required',
      'Plugin registration method changed'
    ];

    const compatibilityNotes = [
      'Use LegacyPluginAdapter for gradual migration',
      'Existing functionality can be preserved in detectPatterns()',
      'Quality scoring can start with simple implementations',
      'Backward compatibility maintained through adapter pattern'
    ];

    return {
      pluginName,
      migrationSteps,
      estimatedComplexity: complexity,
      breakingChanges,
      compatibilityNotes
    };
  }

  /**
   * プラグインの複雑度を推定
   */
  private estimateComplexity(pluginCode: string): 'low' | 'medium' | 'high' {
    const complexityIndicators = {
      low: [
        /async\s+analyze.*\{[\s\S]*?\}/m,  // 単純なanalyzeメソッド
        /return\s*\[\]/,                   // 空の配列を返す
      ],
      medium: [
        /private\s+\w+/,                   // プライベートメソッド
        /this\.\w+\(/,                     // インスタンスメソッド呼び出し
        /if\s*\(/,                         // 条件分岐
        /for\s*\(/,                        // ループ
      ],
      high: [
        /class\s+\w+\s+extends/,           // 継承
        /interface\s+\w+/,                 // インターフェース定義
        /async.*await.*async/,             // 複数の非同期処理
        /try\s*\{[\s\S]*catch/,           // エラーハンドリング
        /regex\s*=|new\s+RegExp/,         // 正規表現使用
      ]
    };

    const highScore = complexityIndicators.high.filter(pattern => pattern.test(pluginCode)).length;
    const mediumScore = complexityIndicators.medium.filter(pattern => pattern.test(pluginCode)).length;

    if (highScore >= 2) return 'high';
    if (mediumScore >= 3 || highScore >= 1) return 'medium';
    return 'low';
  }

  /**
   * 新しいプラグインテンプレートを作成
   */
  createMigrationTemplate(legacyPlugin: IPlugin): string {
    const className = this.toPascalCase(legacyPlugin.name) + 'Plugin';
    const pluginId = legacyPlugin.name;
    const pluginName = this.toDisplayName(legacyPlugin.name);

    return `import { BasePlugin } from '../base/BasePlugin';
import { ITestQualityPlugin, TestFile, DetectionResult, QualityScore, Improvement, ProjectContext } from '../../core/types';

export class ${className} extends BasePlugin implements ITestQualityPlugin {
  id = '${pluginId}';
  name = '${pluginName}';
  version = '1.0.0';
  type = 'core' as const;

  isApplicable(context: ProjectContext): boolean {
    // TODO: Implement applicability logic
    return true;
  }

  async detectPatterns(testFile: TestFile): Promise<DetectionResult[]> {
    // TODO: Migrate logic from legacy analyze() method
    // Original analyze() logic should be adapted here
    
    const detectionResults: DetectionResult[] = [];
    
    try {
      // Placeholder for migrated detection logic
      // const originalResults = await this.legacyAnalyze(testFile.path);
      // detectionResults = this.convertToDetectionResults(originalResults);
    } catch (error) {
      console.warn(\`Detection failed for \${testFile.path}: \${error}\`);
    }

    return detectionResults;
  }

  evaluateQuality(patterns: DetectionResult[]): QualityScore {
    // TODO: Implement quality evaluation based on detected patterns
    
    const score = this.calculateBaseScore(patterns);
    const confidence = this.calculateConfidence(patterns);

    return {
      overall: score,
      breakdown: {
        completeness: score,
        correctness: score,
        maintainability: score
      },
      confidence,
      metadata: {
        patternCount: patterns.length,
        pluginVersion: this.version
      }
    };
  }

  suggestImprovements(evaluation: QualityScore): Improvement[] {
    // TODO: Generate improvement suggestions based on quality score
    
    const improvements: Improvement[] = [];

    if (evaluation.overall < 70) {
      improvements.push({
        type: 'enhancement',
        priority: 'medium',
        title: 'Improve test quality',
        description: 'Consider enhancing test coverage and assertions',
        estimatedImpact: evaluation.overall < 50 ? 'high' : 'medium',
        autoFixable: false,
        implementation: {
          manualSteps: [
            'Review test patterns identified by analysis',
            'Address specific quality issues',
            'Verify improvements with re-analysis'
          ]
        }
      });
    }

    return improvements;
  }

  // Helper methods for migration
  private calculateBaseScore(patterns: DetectionResult[]): number {
    // Simple scoring logic - can be enhanced
    return Math.max(0, 100 - (patterns.length * 10));
  }

  private calculateConfidence(patterns: DetectionResult[]): number {
    // Simple confidence calculation - can be enhanced
    return patterns.length > 0 ? 0.8 : 0.5;
  }

  // TODO: Remove after migration is complete
  private async legacyAnalyze(filePath: string): Promise<any[]> {
    // Temporary method to house original analyze() logic during migration
    return [];
  }
}`;
  }

  /**
   * 文字列をPascalCaseに変換
   */
  private toPascalCase(str: string): string {
    return str
      .split(/[-_\s]+/)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join('');
  }

  /**
   * 表示用の名前に変換
   */
  private toDisplayName(str: string): string {
    return str
      .split(/[-_]+/)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  }

  /**
   * 移行ガイドを生成
   */
  generateMigrationGuide(migrationPlan: MigrationPlan): string {
    return `# Migration Guide for ${migrationPlan.pluginName}

## Overview
This guide will help you migrate the \`${migrationPlan.pluginName}\` plugin from the legacy IPlugin interface to the new ITestQualityPlugin interface.

**Estimated Complexity:** ${migrationPlan.estimatedComplexity}

## Migration Steps

${migrationPlan.migrationSteps.map((step, index) => `${index + 1}. ${step}`).join('\n')}

## Breaking Changes

The following changes will break existing functionality:

${migrationPlan.breakingChanges.map(change => `- ${change}`).join('\n')}

## Compatibility Notes

${migrationPlan.compatibilityNotes.map(note => `- ${note}`).join('\n')}

## Migration Template

Use the migration template generated by \`createMigrationTemplate()\` as a starting point for your migration.

## Testing

After migration, ensure that:

1. All existing functionality is preserved
2. New methods return appropriate values
3. Plugin integrates with the new plugin manager
4. Performance characteristics are maintained

## Support

If you encounter issues during migration:

1. Check the LegacyPluginAdapter for temporary compatibility
2. Review reference implementations in the core plugins directory
3. Consult the ITestQualityPlugin interface documentation

## Rollback Plan

If migration encounters critical issues:

1. Revert to original plugin code
2. Use LegacyPluginAdapter for integration
3. Schedule migration for a future release

---

*Generated by Rimor Migration Helper*
`;
  }

  /**
   * レガシープラグインコードを新形式に変換
   */
  transformPlugin(legacyCode: string): string {
    // 基本的な変換ロジック
    let transformedCode = legacyCode;

    // クラス宣言の変換
    transformedCode = transformedCode.replace(
      /export\s+class\s+(\w+)\s*{/,
      'import { BasePlugin } from \'../base/BasePlugin\';\nimport { ITestQualityPlugin, TestFile, DetectionResult, QualityScore, Improvement, ProjectContext } from \'../../core/types\';\n\nexport class $1 extends BasePlugin implements ITestQualityPlugin {'
    );

    // nameプロパティをid/nameプロパティに変換
    const nameMatch = transformedCode.match(/name\s*=\s*['"]([^'"]+)['"]/);
    if (nameMatch) {
      const pluginName = nameMatch[1];
      transformedCode = transformedCode.replace(
        /name\s*=\s*['"][^'"]+['"];?/,
        `id = '${pluginName}';\n  name = '${this.toDisplayName(pluginName)}';\n  version = '1.0.0';\n  type = 'core' as const;`
      );
    }

    // 必須メソッドの追加
    const requiredMethods = `
  isApplicable(context: ProjectContext): boolean {
    return true;
  }

  async detectPatterns(testFile: TestFile): Promise<DetectionResult[]> {
    // TODO: Migrate analyze() logic here
    return [];
  }

  evaluateQuality(patterns: DetectionResult[]): QualityScore {
    return {
      overall: 100,
      breakdown: { completeness: 100, correctness: 100, maintainability: 100 },
      confidence: 1.0
    };
  }

  suggestImprovements(evaluation: QualityScore): Improvement[] {
    return [];
  }`;

    // クラスの最後に必須メソッドを追加
    transformedCode = transformedCode.replace(/}$/, requiredMethods + '\n}');

    return transformedCode;
  }

  /**
   * 移行されたプラグインを検証
   */
  validateMigratedPlugin(pluginCode: string): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // 必須インターフェースのチェック
    if (!pluginCode.includes('implements ITestQualityPlugin')) {
      errors.push('Plugin must implement ITestQualityPlugin interface');
    }

    // 必須プロパティのチェック
    const requiredProperties = ['id', 'name', 'version', 'type'];
    requiredProperties.forEach(prop => {
      if (!new RegExp(`${prop}\\s*[:=]`).test(pluginCode)) {
        errors.push(`Plugin missing required property: ${prop}`);
      }
    });

    // 必須メソッドのチェック
    const requiredMethods = ['isApplicable', 'detectPatterns', 'evaluateQuality', 'suggestImprovements'];
    requiredMethods.forEach(method => {
      if (!new RegExp(`${method}\\s*\\(`).test(pluginCode)) {
        errors.push(`Plugin missing required method: ${method}`);
      }
    });

    // 警告のチェック
    if (pluginCode.includes('TODO')) {
      warnings.push('Plugin contains TODO comments that should be addressed');
    }

    if (!pluginCode.includes('extends BasePlugin')) {
      warnings.push('Consider extending BasePlugin for utility methods');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * 移行レポートを生成
   */
  async generateMigrationReport(directory: string): Promise<MigrationReport> {
    const pluginFiles = await this.findPluginFiles(directory);
    const pluginDetails: MigrationReport['pluginDetails'] = [];
    
    let legacyCount = 0;
    let modernCount = 0;
    let complexPlugins = 0;

    for (const filePath of pluginFiles) {
      try {
        const content = await fs.readFile(filePath, 'utf-8');
        const isLegacy = this.isLegacyPlugin(content);
        const complexity = isLegacy ? this.estimateComplexity(content) : 'n/a';
        
        const nameMatch = content.match(/(?:name|id)\s*[:=]\s*['"]([^'"]+)['"]/);
        const pluginName = nameMatch ? nameMatch[1] : path.basename(filePath, path.extname(filePath));

        pluginDetails.push({
          name: pluginName,
          type: isLegacy ? 'legacy' : 'modern',
          complexity,
          filePath
        });

        if (isLegacy) {
          legacyCount++;
          if (complexity === 'high') {
            complexPlugins++;
          }
        } else {
          modernCount++;
        }
      } catch (error) {
        // ファイル読み込みエラーは無視
      }
    }

    const totalEffort = this.calculateTotalEffort(legacyCount, complexPlugins);
    const estimatedHours = this.estimateHours(legacyCount, complexPlugins);

    return {
      totalPlugins: pluginFiles.length,
      legacyPlugins: legacyCount,
      modernPlugins: modernCount,
      migrationEstimate: {
        totalEffort,
        estimatedHours,
        complexPlugins
      },
      pluginDetails
    };
  }

  /**
   * 全体的な移行作業量を計算
   */
  private calculateTotalEffort(legacyCount: number, complexPlugins: number): string {
    if (legacyCount === 0) return 'none';
    if (legacyCount <= 2 && complexPlugins === 0) return 'low';
    if (legacyCount <= 5 && complexPlugins <= 1) return 'medium';
    return 'high';
  }

  /**
   * 推定作業時間を計算
   */
  private estimateHours(legacyCount: number, complexPlugins: number): number {
    const baseHours = legacyCount * 4; // プラグインあたり基本4時間
    const complexityBonus = complexPlugins * 8; // 複雑なプラグインは追加8時間
    return baseHours + complexityBonus;
  }

  /**
   * 移行概要を作成
   */
  createMigrationSummary(report: MigrationReport): string {
    return `# Rimor Plugin Migration Summary

## Overview
- **Total Plugins**: ${report.totalPlugins}
- **Legacy Plugins**: ${report.legacyPlugins}
- **Modern Plugins**: ${report.modernPlugins}

## Migration Estimate
- **Total Effort**: ${report.migrationEstimate.totalEffort}
- **Estimated Hours**: ${report.migrationEstimate.estimatedHours}
- **Complex Plugins**: ${report.migrationEstimate.complexPlugins}

## Plugin Details

${report.pluginDetails.map(plugin => 
  `- **${plugin.name}** (${plugin.type}) - Complexity: ${plugin.complexity}`
).join('\n')}

## Next Steps

${report.legacyPlugins > 0 ? `
1. Review migration plans for ${report.legacyPlugins} legacy plugins
2. Start with low-complexity plugins for easier wins
3. Use LegacyPluginAdapter for gradual migration
4. Test thoroughly after each plugin migration
` : '✅ All plugins are already using the modern interface!'}

---
*Generated on ${new Date().toISOString().split('T')[0]}*
`;
  }

  /**
   * API互換性をチェック
   */
  checkCompatibility(legacyInterface: Record<string, string>, newInterface: Record<string, string>): CompatibilityResult {
    const breakingChanges: string[] = [];
    const newRequirements: string[] = [];
    const suggestions: string[] = [];

    // レガシーインターフェースで削除されたメソッド
    Object.keys(legacyInterface).forEach(method => {
      if (!newInterface[method]) {
        breakingChanges.push(`Method ${method} removed`);
      }
    });

    // 新インターフェースで必要な新しいメソッド
    Object.keys(newInterface).forEach(method => {
      if (!legacyInterface[method]) {
        newRequirements.push(`Method ${method} required`);
      }
    });

    const isCompatible = breakingChanges.length === 0 && newRequirements.length === 0;

    return {
      isCompatible,
      breakingChanges,
      newRequirements,
      suggestions
    };
  }

  /**
   * 互換性解決策を提案
   */
  suggestCompatibilitySolutions(breakingChanges: string[]): string[] {
    const solutions: string[] = [
      'Use LegacyPluginAdapter for gradual migration',
      'Implement ITestQualityPlugin interface',
      'Update method signatures to match new interface'
    ];

    if (breakingChanges.some(change => change.includes('analyze'))) {
      solutions.push('Migrate analyze() logic to detectPatterns() method');
    }

    if (breakingChanges.some(change => change.includes('return type'))) {
      solutions.push('Convert Issue[] results to DetectionResult[] format');
    }

    return solutions;
  }
}