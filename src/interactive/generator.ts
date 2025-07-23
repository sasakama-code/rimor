import { Pattern, PluginMetadata } from './types';
import { getMessage } from '../i18n/messages';

/**
 * パターンからTypeScriptプラグインコードを生成
 * v0.2.0では基本的なstring-matchパターンを実装
 */
export class PluginGenerator {
  
  /**
   * パターンとメタデータからプラグインコードを生成
   */
  generate(patterns: Pattern[], metadata: PluginMetadata): string {
    const className = this.generateClassName(metadata.name);
    const patternChecks = patterns.map((pattern, index) => 
      this.generatePatternCheck(pattern, index)
    ).join('\n\n    ');

    const template = `import * as fs from 'fs';
import { IPlugin, Issue } from '../core/types';

/**
 * ${metadata.description}
 * 
 * 生成日時: ${metadata.createdAt.toISOString()}
 * 作成方法: ${metadata.createdBy}
 * 
 * 検出パターン:
${patterns.map(p => ` * - ${p.description} (信頼度: ${p.confidence})`).join('\n')}
 */
export class ${className} implements IPlugin {
  name = '${metadata.name}';

  async analyze(filePath: string): Promise<Issue[]> {
    const content = await fs.readFile(filePath, 'utf-8');
    const issues: Issue[] = [];

    ${patterns.length > 0 ? patternChecks : getMessage('interactive.generator.no_patterns')}

    return issues;
  }
}`;

    return template;
  }

  /**
   * プラグイン名からクラス名を生成（PascalCase）
   */
  generateClassName(pluginName: string): string {
    const baseName = pluginName
      .split(/[-_]/)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join('');
    
    // すでに'Plugin'で終わっている場合は追加しない
    return baseName.endsWith('Plugin') ? baseName : baseName + 'Plugin';
  }

  /**
   * 個別パターンのチェックコードを生成
   */
  generatePatternCheck(pattern: Pattern, index: number): string {
    const escapedPattern = pattern.value.replace(/'/g, "\\'");
    
    switch (pattern.type) {
      case 'string-match':
        return `// パターン: ${pattern.value} (${pattern.description})
    // 信頼度: ${pattern.confidence}
    if (!content.includes('${escapedPattern}')) {
      issues.push({
        type: 'missing-pattern',
        severity: 'warning',
        message: 'パターンが見つかりません: ${pattern.value}',
        file: filePath
      });
    }`;

      case 'regex':
        return `// パターン: ${pattern.value} (${pattern.description})
    // 信頼度: ${pattern.confidence}
    const regex${index} = new RegExp('${escapedPattern}');
    if (!regex${index}.test(content)) {
      issues.push({
        type: 'missing-pattern',
        severity: 'warning', 
        message: 'パターンが見つかりません: ${pattern.value}',
        file: filePath
      });
    }`;

      case 'structure':
        return `// 構造パターン: ${pattern.value} (${pattern.description})
    // 信頼度: ${pattern.confidence}
    // 構造チェックは v0.3.0で実装予定
    // TODO: ${pattern.value} の構造チェックを実装`;

      default:
        return `// 未知のパターンタイプ: ${pattern.type}
    // ${pattern.description}`;
    }
  }
}