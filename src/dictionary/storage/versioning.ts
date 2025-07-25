import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import { DomainDictionary, DictionaryDiff, DomainTerm, BusinessRule } from '../../core/types';
import { DictionaryLoader } from './loader';
import { errorHandler, ErrorType } from '../../utils/errorHandler';

/**
 * 辞書バージョン管理システム
 * 辞書の変更履歴管理、差分計算、マージ機能を提供
 */
export class DictionaryVersioning {
  private versionsDir: string;
  private maxVersions: number;

  constructor(options: {
    versionsDir?: string;
    maxVersions?: number;
  } = {}) {
    this.versionsDir = options.versionsDir || path.join(process.cwd(), '.rimor', 'versions');
    this.maxVersions = options.maxVersions || 50;

    // バージョンディレクトリの作成
    if (!fs.existsSync(this.versionsDir)) {
      fs.mkdirSync(this.versionsDir, { recursive: true });
    }
  }

  /**
   * 辞書の新しいバージョンを作成
   */
  async createVersion(
    dictionary: DomainDictionary,
    message?: string,
    metadata?: Record<string, any>
  ): Promise<string> {
    try {
      const version = this.generateVersionId();
      const timestamp = new Date();

      // バージョン情報の作成
      const versionInfo = {
        version,
        timestamp: timestamp.toISOString(),
        message: message || `バージョン ${version} を作成`,
        metadata: metadata || {},
        dictionary: dictionary,
        hash: this.calculateDictionaryHash(dictionary)
      };

      // バージョンファイルの保存
      const versionPath = path.join(this.versionsDir, `${version}.json`);
      fs.writeFileSync(versionPath, JSON.stringify(versionInfo, null, 2), 'utf-8');

      // 古いバージョンのクリーンアップ
      await this.cleanupOldVersions();

      return version;
    } catch (error) {
      errorHandler.handleError(error, ErrorType.SYSTEM_ERROR, 'バージョン作成に失敗しました');
      throw error;
    }
  }

  /**
   * 指定バージョンの辞書を取得
   */
  async getVersion(version: string): Promise<{
    dictionary: DomainDictionary;
    metadata: {
      version: string;
      timestamp: string;
      message: string;
      metadata: Record<string, any>;
      hash: string;
    };
  } | null> {
    try {
      const versionPath = path.join(this.versionsDir, `${version}.json`);
      
      if (!fs.existsSync(versionPath)) {
        return null;
      }

      const versionData = JSON.parse(fs.readFileSync(versionPath, 'utf-8'));
      
      return {
        dictionary: versionData.dictionary,
        metadata: {
          version: versionData.version,
          timestamp: versionData.timestamp,
          message: versionData.message,
          metadata: versionData.metadata,
          hash: versionData.hash
        }
      };
    } catch (error) {
      errorHandler.handleError(error, ErrorType.SYSTEM_ERROR, 'バージョン取得に失敗しました');
      return null;
    }
  }

  /**
   * 全バージョンのリストを取得
   */
  async listVersions(): Promise<Array<{
    version: string;
    timestamp: string;
    message: string;
    hash: string;
  }>> {
    try {
      const versions: Array<{
        version: string;
        timestamp: string;
        message: string;
        hash: string;
      }> = [];

      if (!fs.existsSync(this.versionsDir)) {
        return versions;
      }

      const files = fs.readdirSync(this.versionsDir);
      const versionFiles = files.filter(file => file.endsWith('.json'));

      for (const file of versionFiles) {
        try {
          const versionPath = path.join(this.versionsDir, file);
          const versionData = JSON.parse(fs.readFileSync(versionPath, 'utf-8'));
          
          versions.push({
            version: versionData.version,
            timestamp: versionData.timestamp,
            message: versionData.message,
            hash: versionData.hash
          });
        } catch (error) {
          // 破損したバージョンファイルは無視
          console.warn(`バージョンファイル ${file} の読み込みに失敗しました`);
        }
      }

      // タイムスタンプでソート（新しい順）
      return versions.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    } catch (error) {
      errorHandler.handleError(error, ErrorType.SYSTEM_ERROR, 'バージョンリスト取得に失敗しました');
      return [];
    }
  }

  /**
   * 2つのバージョン間の差分を計算
   */
  async calculateDiff(
    fromVersion: string,
    toVersion: string
  ): Promise<DictionaryDiff | null> {
    try {
      const fromData = await this.getVersion(fromVersion);
      const toData = await this.getVersion(toVersion);

      if (!fromData || !toData) {
        throw new Error('指定されたバージョンが見つかりません');
      }

      return this.computeDictionaryDiff(fromData.dictionary, toData.dictionary);
    } catch (error) {
      errorHandler.handleError(error, ErrorType.SYSTEM_ERROR, '差分計算に失敗しました');
      return null;
    }
  }

  /**
   * 辞書の差分を計算（オブジェクト直接比較版）
   */
  computeDictionaryDiff(
    oldDictionary: DomainDictionary,
    newDictionary: DomainDictionary
  ): DictionaryDiff {
    const diff: DictionaryDiff = {
      added: { terms: [], rules: [] },
      modified: { terms: [], rules: [] },
      removed: { terms: [], rules: [] }
    };

    // 用語の差分計算
    const oldTermsMap = new Map(oldDictionary.terms.map(t => [t.id, t]));
    const newTermsMap = new Map(newDictionary.terms.map(t => [t.id, t]));

    // 追加された用語
    for (const [id, term] of newTermsMap) {
      if (!oldTermsMap.has(id)) {
        diff.added.terms.push(term);
      }
    }

    // 削除された用語
    for (const [id, term] of oldTermsMap) {
      if (!newTermsMap.has(id)) {
        diff.removed.terms.push(term);
      }
    }

    // 変更された用語
    for (const [id, newTerm] of newTermsMap) {
      const oldTerm = oldTermsMap.get(id);
      if (oldTerm && !this.areTermsEqual(oldTerm, newTerm)) {
        diff.modified.terms.push({ old: oldTerm, new: newTerm });
      }
    }

    // ビジネスルールの差分計算
    const oldRulesMap = new Map(oldDictionary.businessRules.map(r => [r.id, r]));
    const newRulesMap = new Map(newDictionary.businessRules.map(r => [r.id, r]));

    // 追加されたルール
    for (const [id, rule] of newRulesMap) {
      if (!oldRulesMap.has(id)) {
        diff.added.rules.push(rule);
      }
    }

    // 削除されたルール
    for (const [id, rule] of oldRulesMap) {
      if (!newRulesMap.has(id)) {
        diff.removed.rules.push(rule);
      }
    }

    // 変更されたルール
    for (const [id, newRule] of newRulesMap) {
      const oldRule = oldRulesMap.get(id);
      if (oldRule && !this.areRulesEqual(oldRule, newRule)) {
        diff.modified.rules.push({ old: oldRule, new: newRule });
      }
    }

    return diff;
  }

  /**
   * 複数の辞書をマージ
   */
  async mergeDictionaries(
    baseDictionary: DomainDictionary,
    ...mergeDictionaries: DomainDictionary[]
  ): Promise<DomainDictionary> {
    try {
      let result = { ...baseDictionary };

      for (const mergeDict of mergeDictionaries) {
        result = DictionaryLoader.mergeDictionaries(result, mergeDict);
      }

      // マージ後の辞書のバージョンを更新
      result.version = this.incrementVersion(result.version);
      result.lastUpdated = new Date();

      return result;
    } catch (error) {
      errorHandler.handleError(error, ErrorType.SYSTEM_ERROR, '辞書マージに失敗しました');
      throw error;
    }
  }

  /**
   * 指定バージョンから辞書を復元
   */
  async restoreVersion(version: string): Promise<DomainDictionary | null> {
    try {
      const versionData = await this.getVersion(version);
      if (!versionData) {
        return null;
      }

      return versionData.dictionary;
    } catch (error) {
      errorHandler.handleError(error, ErrorType.SYSTEM_ERROR, 'バージョン復元に失敗しました');
      return null;
    }
  }

  /**
   * バージョン履歴の圧縮
   */
  async compactHistory(keepVersions: number = 10): Promise<void> {
    try {
      const versions = await this.listVersions();
      
      if (versions.length <= keepVersions) {
        return;
      }

      // 保持するバージョン以外を削除
      const versionsToDelete = versions.slice(keepVersions);
      
      for (const version of versionsToDelete) {
        const versionPath = path.join(this.versionsDir, `${version.version}.json`);
        if (fs.existsSync(versionPath)) {
          fs.unlinkSync(versionPath);
        }
      }
    } catch (error) {
      errorHandler.handleError(error, ErrorType.SYSTEM_ERROR, '履歴圧縮に失敗しました');
    }
  }

  /**
   * バージョン統計の取得
   */
  async getVersioningStats(): Promise<{
    totalVersions: number;
    oldestVersion: string | null;
    newestVersion: string | null;
    totalSize: number;
    averageSize: number;
  }> {
    try {
      const versions = await this.listVersions();
      let totalSize = 0;

      if (versions.length === 0) {
        return {
          totalVersions: 0,
          oldestVersion: null,
          newestVersion: null,
          totalSize: 0,
          averageSize: 0
        };
      }

      // ファイルサイズの計算
      for (const version of versions) {
        const versionPath = path.join(this.versionsDir, `${version.version}.json`);
        if (fs.existsSync(versionPath)) {
          const stats = fs.statSync(versionPath);
          totalSize += stats.size;
        }
      }

      return {
        totalVersions: versions.length,
        oldestVersion: versions[versions.length - 1]?.version || null,
        newestVersion: versions[0]?.version || null,
        totalSize,
        averageSize: versions.length > 0 ? totalSize / versions.length : 0
      };
    } catch (error) {
      errorHandler.handleError(error, ErrorType.SYSTEM_ERROR, 'バージョン統計取得に失敗しました');
      return {
        totalVersions: 0,
        oldestVersion: null,
        newestVersion: null,
        totalSize: 0,
        averageSize: 0
      };
    }
  }

  // ========================================
  // プライベートメソッド
  // ========================================

  /**
   * バージョンIDの生成
   */
  private generateVersionId(): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    return `v${timestamp}-${random}`;
  }

  /**
   * 辞書のハッシュ値計算
   */
  private calculateDictionaryHash(dictionary: DomainDictionary): string {
    // 辞書の主要部分をハッシュ化（lastUpdatedは除外）
    const hashData = {
      version: dictionary.version,
      domain: dictionary.domain,
      language: dictionary.language,
      terms: dictionary.terms,
      relationships: dictionary.relationships,
      businessRules: dictionary.businessRules,
      qualityStandards: dictionary.qualityStandards,
      contextMappings: dictionary.contextMappings
    };

    const hash = crypto.createHash('sha256');
    hash.update(JSON.stringify(hashData));
    return hash.digest('hex').substring(0, 16);
  }

  /**
   * 用語の等価性チェック
   */
  private areTermsEqual(term1: DomainTerm, term2: DomainTerm): boolean {
    return (
      term1.term === term2.term &&
      term1.definition === term2.definition &&
      term1.category === term2.category &&
      term1.importance === term2.importance &&
      JSON.stringify(term1.aliases.sort()) === JSON.stringify(term2.aliases.sort()) &&
      JSON.stringify(term1.examples) === JSON.stringify(term2.examples) &&
      JSON.stringify(term1.relatedPatterns.sort()) === JSON.stringify(term2.relatedPatterns.sort()) &&
      JSON.stringify(term1.testRequirements.sort()) === JSON.stringify(term2.testRequirements.sort())
    );
  }

  /**
   * ビジネスルールの等価性チェック
   */
  private areRulesEqual(rule1: BusinessRule, rule2: BusinessRule): boolean {
    return (
      rule1.name === rule2.name &&
      rule1.description === rule2.description &&
      rule1.domain === rule2.domain &&
      rule1.priority === rule2.priority &&
      JSON.stringify(rule1.condition) === JSON.stringify(rule2.condition) &&
      JSON.stringify(rule1.requirements) === JSON.stringify(rule2.requirements) &&
      JSON.stringify(rule1.compliance) === JSON.stringify(rule2.compliance)
    );
  }

  /**
   * バージョン番号のインクリメント
   */
  private incrementVersion(currentVersion: string): string {
    const versionMatch = currentVersion.match(/^(\d+)\.(\d+)\.(\d+)$/);
    if (versionMatch) {
      const major = parseInt(versionMatch[1]);
      const minor = parseInt(versionMatch[2]);
      const patch = parseInt(versionMatch[3]);
      return `${major}.${minor}.${patch + 1}`;
    }
    
    // セマンティックバージョニングでない場合はタイムスタンプベース
    return `1.0.${Date.now()}`;
  }

  /**
   * 古いバージョンのクリーンアップ
   */
  private async cleanupOldVersions(): Promise<void> {
    try {
      const versions = await this.listVersions();
      
      if (versions.length > this.maxVersions) {
        const versionsToDelete = versions.slice(this.maxVersions);
        
        for (const version of versionsToDelete) {
          const versionPath = path.join(this.versionsDir, `${version.version}.json`);
          if (fs.existsSync(versionPath)) {
            fs.unlinkSync(versionPath);
          }
        }
      }
    } catch (error) {
      // クリーンアップエラーは警告として処理
      console.warn('古いバージョンのクリーンアップに失敗しました:', error);
    }
  }
}

/**
 * 変更点の可視化ユーティリティ
 */
export class DiffVisualizer {
  
  /**
   * 差分をテキスト形式で表示
   */
  static formatDiffAsText(diff: DictionaryDiff): string {
    const output: string[] = [];

    // 追加された用語
    if (diff.added.terms.length > 0) {
      output.push('📚 追加された用語:');
      diff.added.terms.forEach(term => {
        output.push(`  + ${term.term} (${term.category})`);
        output.push(`    定義: ${term.definition}`);
      });
      output.push('');
    }

    // 削除された用語
    if (diff.removed.terms.length > 0) {
      output.push('🗑️  削除された用語:');
      diff.removed.terms.forEach(term => {
        output.push(`  - ${term.term} (${term.category})`);
      });
      output.push('');
    }

    // 変更された用語
    if (diff.modified.terms.length > 0) {
      output.push('📝 変更された用語:');
      diff.modified.terms.forEach(({ old, new: newTerm }) => {
        output.push(`  ~ ${old.term}`);
        if (old.definition !== newTerm.definition) {
          output.push(`    定義: "${old.definition}" → "${newTerm.definition}"`);
        }
        if (old.category !== newTerm.category) {
          output.push(`    カテゴリ: ${old.category} → ${newTerm.category}`);
        }
        if (old.importance !== newTerm.importance) {
          output.push(`    重要度: ${old.importance} → ${newTerm.importance}`);
        }
      });
      output.push('');
    }

    // 追加されたルール
    if (diff.added.rules.length > 0) {
      output.push('📏 追加されたルール:');
      diff.added.rules.forEach(rule => {
        output.push(`  + ${rule.name}`);
        output.push(`    説明: ${rule.description}`);
      });
      output.push('');
    }

    // 削除されたルール
    if (diff.removed.rules.length > 0) {
      output.push('🗑️  削除されたルール:');
      diff.removed.rules.forEach(rule => {
        output.push(`  - ${rule.name}`);
      });
      output.push('');
    }

    // 変更されたルール
    if (diff.modified.rules.length > 0) {
      output.push('📝 変更されたルール:');
      diff.modified.rules.forEach(({ old, new: newRule }) => {
        output.push(`  ~ ${old.name}`);
        if (old.description !== newRule.description) {
          output.push(`    説明: "${old.description}" → "${newRule.description}"`);
        }
        if (old.priority !== newRule.priority) {
          output.push(`    優先度: ${old.priority} → ${newRule.priority}`);
        }
      });
    }

    return output.join('\n');
  }

  /**
   * 差分統計の生成
   */
  static generateDiffStats(diff: DictionaryDiff): {
    totalChanges: number;
    termsChanged: number;
    rulesChanged: number;
    additions: number;
    deletions: number;
    modifications: number;
  } {
    const termsChanged = diff.added.terms.length + diff.removed.terms.length + diff.modified.terms.length;
    const rulesChanged = diff.added.rules.length + diff.removed.rules.length + diff.modified.rules.length;
    const additions = diff.added.terms.length + diff.added.rules.length;
    const deletions = diff.removed.terms.length + diff.removed.rules.length;
    const modifications = diff.modified.terms.length + diff.modified.rules.length;

    return {
      totalChanges: termsChanged + rulesChanged,
      termsChanged,
      rulesChanged,
      additions,
      deletions,
      modifications
    };
  }
}