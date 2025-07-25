import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';
import { DomainDictionary, DomainTerm, BusinessRule } from '../../core/types';
import { errorHandler, ErrorType } from '../../utils/errorHandler';

/**
 * ドメイン辞書の永続化・読み込みクラス
 * YAML形式での保存・読み込みを行う
 */
export class DictionaryLoader {
  private static readonly DEFAULT_DICTIONARY_FILE = 'dictionary.yaml';
  private static readonly BACKUP_EXTENSION = '.backup';

  /**
   * 辞書をYAMLファイルから読み込み
   */
  static async loadFromFile(filePath: string): Promise<DomainDictionary> {
    try {
      if (!fs.existsSync(filePath)) {
        throw new Error(`辞書ファイルが見つかりません: ${filePath}`);
      }

      const fileContent = fs.readFileSync(filePath, 'utf-8');
      const yamlData = yaml.load(fileContent) as any;

      if (!yamlData) {
        throw new Error('YAML形式が不正です');
      }

      const dictionary = this.validateAndConvertYamlToDictionary(yamlData);
      return dictionary;
    } catch (error) {
      errorHandler.handleError(error, ErrorType.SYSTEM_ERROR, '辞書ファイルの読み込みに失敗しました');
      throw error;
    }
  }

  /**
   * 辞書をYAMLファイルに保存
   */
  static async saveToFile(dictionary: DomainDictionary, filePath: string): Promise<void> {
    try {
      // バックアップ作成
      if (fs.existsSync(filePath)) {
        const backupPath = filePath + this.BACKUP_EXTENSION;
        fs.copyFileSync(filePath, backupPath);
      }

      // ディレクトリが存在しない場合は作成
      const directory = path.dirname(filePath);
      if (!fs.existsSync(directory)) {
        fs.mkdirSync(directory, { recursive: true });
      }

      // YAML形式に変換
      const yamlData = this.convertDictionaryToYaml(dictionary);
      const yamlString = yaml.dump(yamlData, {
        indent: 2,
        lineWidth: 120,
        noRefs: true,
        sortKeys: true
      });

      // ファイルに書き込み
      fs.writeFileSync(filePath, yamlString, 'utf-8');
    } catch (error) {
      errorHandler.handleError(error, ErrorType.SYSTEM_ERROR, '辞書ファイルの保存に失敗しました');
      throw error;
    }
  }

  /**
   * プロジェクトルートから辞書を自動検出・読み込み
   */
  static async autoLoadFromProject(projectRoot: string): Promise<DomainDictionary | null> {
    try {
      const possiblePaths = [
        path.join(projectRoot, '.rimor', this.DEFAULT_DICTIONARY_FILE),
        path.join(projectRoot, '.rimor', 'dictionary.json'),
        path.join(projectRoot, 'rimor.dictionary.yaml'),
        path.join(projectRoot, 'rimor.dictionary.json')
      ];

      for (const filePath of possiblePaths) {
        if (fs.existsSync(filePath)) {
          if (filePath.endsWith('.yaml') || filePath.endsWith('.yml')) {
            return await this.loadFromFile(filePath);
          } else if (filePath.endsWith('.json')) {
            return await this.loadFromJsonFile(filePath);
          }
        }
      }

      return null;
    } catch (error) {
      errorHandler.handleError(error, ErrorType.SYSTEM_ERROR, '辞書の自動読み込みに失敗しました');
      return null;
    }
  }

  /**
   * デフォルトの辞書保存パスを取得
   */
  static getDefaultPath(projectRoot: string): string {
    return path.join(projectRoot, '.rimor', this.DEFAULT_DICTIONARY_FILE);
  }

  /**
   * 辞書のマージ
   */
  static mergeDictionaries(
    baseDictionary: DomainDictionary,
    mergeDictionary: DomainDictionary
  ): DomainDictionary {
    try {
      // 用語のマージ（IDベースで重複排除）
      const mergedTerms = [...baseDictionary.terms];
      const existingTermIds = new Set(baseDictionary.terms.map(t => t.id));

      mergeDictionary.terms.forEach(term => {
        if (!existingTermIds.has(term.id)) {
          mergedTerms.push(term);
        }
      });

      // ビジネスルールのマージ
      const mergedRules = [...baseDictionary.businessRules];
      const existingRuleIds = new Set(baseDictionary.businessRules.map(r => r.id));

      mergeDictionary.businessRules.forEach(rule => {
        if (!existingRuleIds.has(rule.id)) {
          mergedRules.push(rule);
        }
      });

      // その他の要素のマージ
      const mergedRelationships = [
        ...baseDictionary.relationships,
        ...mergeDictionary.relationships
      ];

      const mergedQualityStandards = [
        ...baseDictionary.qualityStandards,
        ...mergeDictionary.qualityStandards
      ];

      const mergedContextMappings = [
        ...baseDictionary.contextMappings,
        ...mergeDictionary.contextMappings
      ];

      return {
        version: baseDictionary.version,
        domain: baseDictionary.domain,
        language: baseDictionary.language,
        lastUpdated: new Date(),
        terms: mergedTerms,
        relationships: mergedRelationships,
        businessRules: mergedRules,
        qualityStandards: mergedQualityStandards,
        contextMappings: mergedContextMappings
      };
    } catch (error) {
      errorHandler.handleError(error, ErrorType.SYSTEM_ERROR, '辞書のマージに失敗しました');
      throw error;
    }
  }

  /**
   * 辞書のバックアップ作成
   */
  static async createBackup(filePath: string): Promise<string> {
    try {
      if (!fs.existsSync(filePath)) {
        throw new Error(`バックアップ対象ファイルが見つかりません: ${filePath}`);
      }

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupPath = `${filePath}.backup.${timestamp}`;
      
      fs.copyFileSync(filePath, backupPath);
      return backupPath;
    } catch (error) {
      errorHandler.handleError(error, ErrorType.SYSTEM_ERROR, 'バックアップ作成に失敗しました');
      throw error;
    }
  }

  /**
   * 辞書の検証
   */
  static validateDictionary(dictionary: DomainDictionary): {
    isValid: boolean;
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      // 基本構造の検証
      if (!dictionary.version) errors.push('バージョン情報が不足しています');
      if (!dictionary.domain) errors.push('ドメイン情報が不足しています');
      if (!dictionary.language) errors.push('言語情報が不足しています');
      if (!dictionary.lastUpdated) errors.push('更新日時情報が不足しています');

      // 配列の初期化チェック
      if (!Array.isArray(dictionary.terms)) errors.push('用語配列が不正です');
      if (!Array.isArray(dictionary.relationships)) errors.push('関係性配列が不正です');
      if (!Array.isArray(dictionary.businessRules)) errors.push('ビジネスルール配列が不正です');
      if (!Array.isArray(dictionary.qualityStandards)) errors.push('品質基準配列が不正です');
      if (!Array.isArray(dictionary.contextMappings)) errors.push('コンテキストマッピング配列が不正です');

      // 用語の検証
      const termIds = new Set<string>();
      dictionary.terms?.forEach((term, index) => {
        if (!term.id) errors.push(`用語${index + 1}: IDが不足しています`);
        if (!term.term) errors.push(`用語${index + 1}: 用語名が不足しています`);
        if (!term.definition) errors.push(`用語${index + 1}: 定義が不足しています`);
        if (!term.category) errors.push(`用語${index + 1}: カテゴリが不足しています`);

        // ID重複チェック
        if (term.id) {
          if (termIds.has(term.id)) {
            errors.push(`用語ID「${term.id}」が重複しています`);
          } else {
            termIds.add(term.id);
          }
        }

        // 重要度の検証
        if (term.importance && !['critical', 'high', 'medium', 'low'].includes(term.importance)) {
          errors.push(`用語「${term.term}」: 無効な重要度「${term.importance}」`);
        }

        // 配列の検証
        if (!Array.isArray(term.aliases)) warnings.push(`用語「${term.term}」: エイリアスが配列ではありません`);
        if (!Array.isArray(term.examples)) warnings.push(`用語「${term.term}」: 例文が配列ではありません`);
        if (!Array.isArray(term.relatedPatterns)) warnings.push(`用語「${term.term}」: 関連パターンが配列ではありません`);
        if (!Array.isArray(term.testRequirements)) warnings.push(`用語「${term.term}」: テスト要件が配列ではありません`);
      });

      // ビジネスルールの検証
      const ruleIds = new Set<string>();
      dictionary.businessRules?.forEach((rule, index) => {
        if (!rule.id) errors.push(`ルール${index + 1}: IDが不足しています`);
        if (!rule.name) errors.push(`ルール${index + 1}: 名前が不足しています`);
        if (!rule.description) errors.push(`ルール${index + 1}: 説明が不足しています`);
        if (!rule.condition) errors.push(`ルール${index + 1}: 条件が不足しています`);

        // ID重複チェック
        if (rule.id) {
          if (ruleIds.has(rule.id)) {
            errors.push(`ルールID「${rule.id}」が重複しています`);
          } else {
            ruleIds.add(rule.id);
          }
        }

        // 条件の検証
        if (rule.condition) {
          if (!rule.condition.type) errors.push(`ルール「${rule.name}」: 条件タイプが不足しています`);
          if (!rule.condition.pattern) errors.push(`ルール「${rule.name}」: 条件パターンが不足しています`);
          if (!rule.condition.scope) errors.push(`ルール「${rule.name}」: 条件スコープが不足しています`);

          // 有効な条件タイプのチェック
          if (rule.condition.type && !['code-pattern', 'function-name', 'data-type', 'api-endpoint'].includes(rule.condition.type)) {
            errors.push(`ルール「${rule.name}」: 無効な条件タイプ「${rule.condition.type}」`);
          }

          // 有効なスコープのチェック
          if (rule.condition.scope && !['file', 'class', 'function', 'variable'].includes(rule.condition.scope)) {
            errors.push(`ルール「${rule.name}」: 無効なスコープ「${rule.condition.scope}」`);
          }

          // 正規表現の妥当性チェック
          if (rule.condition.pattern) {
            try {
              new RegExp(rule.condition.pattern);
            } catch {
              warnings.push(`ルール「${rule.name}」: 条件パターンが無効な正規表現です`);
            }
          }
        }

        // 要件の検証
        if (!Array.isArray(rule.requirements)) warnings.push(`ルール「${rule.name}」: 要件が配列ではありません`);
      });

      // 関係性の検証（参照整合性）
      dictionary.relationships?.forEach((rel, index) => {
        if (!rel.sourceTermId) errors.push(`関係性${index + 1}: 参照元用語IDが不足しています`);
        if (!rel.targetTermId) errors.push(`関係性${index + 1}: 参照先用語IDが不足しています`);

        // 参照先の存在チェック
        if (rel.sourceTermId && !termIds.has(rel.sourceTermId)) {
          errors.push(`関係性${index + 1}: 参照元用語ID「${rel.sourceTermId}」が存在しません`);
        }
        if (rel.targetTermId && !termIds.has(rel.targetTermId)) {
          errors.push(`関係性${index + 1}: 参照先用語ID「${rel.targetTermId}」が存在しません`);
        }
      });

      return {
        isValid: errors.length === 0,
        errors,
        warnings
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return {
        isValid: false,
        errors: [`辞書検証中にエラーが発生しました: ${errorMessage}`],
        warnings
      };
    }
  }

  // ========================================
  // プライベートメソッド
  // ========================================

  /**
   * YAMLデータを辞書オブジェクトに変換・検証
   */
  private static validateAndConvertYamlToDictionary(yamlData: any): DomainDictionary {
    // 基本フィールドの変換
    const dictionary: DomainDictionary = {
      version: yamlData.version || '1.0.0',
      domain: yamlData.domain || 'general',
      language: yamlData.language || 'ja',
      lastUpdated: yamlData.lastUpdated ? new Date(yamlData.lastUpdated) : new Date(),
      terms: [],
      relationships: [],
      businessRules: [],
      qualityStandards: [],
      contextMappings: []
    };

    // 用語の変換
    if (yamlData.terms && Array.isArray(yamlData.terms)) {
      dictionary.terms = yamlData.terms.map((termData: any) => ({
        id: termData.id || '',
        term: termData.term || '',
        aliases: termData.aliases || [],
        definition: termData.definition || '',
        category: termData.category || 'other',
        importance: termData.importance || 'medium',
        examples: termData.examples || [],
        relatedPatterns: termData.relatedPatterns || termData.related_patterns || [],
        testRequirements: termData.testRequirements || termData.test_requirements || []
      }));
    }

    // ビジネスルールの変換
    if (yamlData.businessRules && Array.isArray(yamlData.businessRules)) {
      dictionary.businessRules = yamlData.businessRules.map((ruleData: any) => ({
        id: ruleData.id || '',
        name: ruleData.name || '',
        description: ruleData.description || '',
        domain: ruleData.domain || dictionary.domain,
        condition: {
          type: ruleData.condition?.type || 'code-pattern',
          pattern: ruleData.condition?.pattern || '',
          scope: ruleData.condition?.scope || 'file'
        },
        requirements: ruleData.requirements || [],
        priority: ruleData.priority || 100,
        compliance: ruleData.compliance
      }));
    }

    // その他のフィールドの変換
    if (yamlData.relationships && Array.isArray(yamlData.relationships)) {
      dictionary.relationships = yamlData.relationships;
    }

    if (yamlData.qualityStandards && Array.isArray(yamlData.qualityStandards)) {
      dictionary.qualityStandards = yamlData.qualityStandards;
    }

    if (yamlData.contextMappings && Array.isArray(yamlData.contextMappings)) {
      dictionary.contextMappings = yamlData.contextMappings;
    }

    return dictionary;
  }

  /**
   * 辞書オブジェクトをYAML用データに変換
   */
  private static convertDictionaryToYaml(dictionary: DomainDictionary): any {
    return {
      version: dictionary.version,
      domain: dictionary.domain,
      language: dictionary.language,
      lastUpdated: dictionary.lastUpdated.toISOString(),
      
      terms: dictionary.terms.map(term => ({
        id: term.id,
        term: term.term,
        aliases: term.aliases,
        definition: term.definition,
        category: term.category,
        importance: term.importance,
        examples: term.examples,
        relatedPatterns: term.relatedPatterns,
        testRequirements: term.testRequirements
      })),

      relationships: dictionary.relationships,

      businessRules: dictionary.businessRules.map(rule => ({
        id: rule.id,
        name: rule.name,
        description: rule.description,
        domain: rule.domain,
        condition: rule.condition,
        requirements: rule.requirements,
        priority: rule.priority,
        compliance: rule.compliance
      })),

      qualityStandards: dictionary.qualityStandards,
      contextMappings: dictionary.contextMappings
    };
  }

  /**
   * JSONファイルから読み込み（下位互換性）
   */
  private static async loadFromJsonFile(filePath: string): Promise<DomainDictionary> {
    try {
      const fileContent = fs.readFileSync(filePath, 'utf-8');
      const jsonData = JSON.parse(fileContent);
      
      // 日付の変換
      if (jsonData.lastUpdated) {
        jsonData.lastUpdated = new Date(jsonData.lastUpdated);
      }

      return this.validateAndConvertYamlToDictionary(jsonData);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`JSONファイルの読み込みに失敗しました: ${errorMessage}`);
    }
  }
}