/**
 * Integrity Hash Generator
 * v0.9.0 - 整合性ハッシュ生成エンジン
 * 
 * KISS原則: シンプルなハッシュ生成と検証
 * YAGNI原則: 必要最小限の機能のみ実装
 * Defensive Programming: 改ざん防止とエラーハンドリング
 */

import { DomainDefinition, IntegrityHash } from './types';
import * as crypto from 'crypto';
import * as fs from 'fs/promises';
import { isNodeError, getErrorMessage } from '../utils/errorGuards';

/**
 * 整合性ハッシュ生成器
 * SOLID原則: 単一責任の原則 - ハッシュ生成と検証のみを担当
 */
export class IntegrityHashGenerator {
  private readonly algorithm = 'sha256';
  private readonly encoding = 'hex' as const;
  private readonly version = '1.0.0';

  /**
   * ドメイン定義からハッシュを生成
   * @param definition - ドメイン定義
   * @returns 整合性ハッシュ
   */
  generateHash(definition: DomainDefinition): IntegrityHash {
    // Defensive Programming: null/undefined対応
    if (!definition) {
      return {
        hash: this.computeHash({}),
        timestamp: new Date(),
        version: this.version
      };
    }

    try {
      // integrityフィールドを除外してハッシュを計算
      const dataForHash = this.prepareDataForHash(definition);
      const hash = this.computeHash(dataForHash);

      return {
        hash,
        timestamp: new Date(),
        version: this.version
      };
    } catch (error) {
      // エラー時は空のオブジェクトのハッシュを返す
      return {
        hash: this.computeHash({}),
        timestamp: new Date(),
        version: this.version
      };
    }
  }

  /**
   * ドメイン定義の整合性を検証
   * @param definition - 検証対象のドメイン定義
   * @returns 検証結果
   */
  verifyHash(definition: DomainDefinition): boolean {
    // Defensive Programming: 入力検証
    if (!definition || !definition.integrity || !definition.integrity.hash) {
      return false;
    }

    try {
      // 保存されているハッシュ
      const storedHash = definition.integrity.hash;

      // 現在のデータから新しいハッシュを計算
      const dataForHash = this.prepareDataForHash(definition);
      const computedHash = this.computeHash(dataForHash);

      // ハッシュを比較
      return storedHash === computedHash;
    } catch (error) {
      return false;
    }
  }

  /**
   * ドメイン定義を整合性ハッシュ付きでファイルに保存
   * @param definition - ドメイン定義
   * @param filePath - 保存先ファイルパス
   */
  async saveWithIntegrity(definition: DomainDefinition, filePath: string): Promise<void> {
    try {
      // ハッシュを生成
      const integrity = this.generateHash(definition);

      // 定義にハッシュを追加
      const definitionWithHash: DomainDefinition = {
        ...definition,
        integrity
      };

      // ファイルに保存
      const content = JSON.stringify(definitionWithHash, null, 2);
      await fs.writeFile(filePath, content, 'utf-8');
    } catch (error) {
      throw new Error(`ファイルの保存に失敗しました: ${error}`);
    }
  }

  /**
   * ファイルから読み込んで整合性を検証
   * @param filePath - ファイルパス
   * @returns 検証結果と定義
   */
  async loadAndVerify(filePath: string): Promise<{
    valid: boolean;
    definition: DomainDefinition | null;
    error?: string;
  }> {
    try {
      // ファイルを読み込み
      const content = await fs.readFile(filePath, 'utf-8');
      const definition = JSON.parse(content, this.dateReviver) as DomainDefinition;

      // 整合性を検証
      if (this.verifyHash(definition)) {
        return {
          valid: true,
          definition
        };
      } else {
        return {
          valid: false,
          definition: null,
          error: 'ファイルが改ざんされている可能性があります'
        };
      }
    } catch (error: unknown) {
      if (isNodeError(error) && error.code === 'ENOENT') {
        return {
          valid: false,
          definition: null,
          error: 'ファイルが見つかりません'
        };
      }
      return {
        valid: false,
        definition: null,
        error: `ファイルの読み込みに失敗しました: ${getErrorMessage(error)}`
      };
    }
  }

  /**
   * ハッシュ計算用にデータを準備
   * integrityフィールドを除外し、正規化する
   */
  private prepareDataForHash(definition: DomainDefinition): unknown {
    // Defensive Programming: 循環参照対策
    try {
      // integrityフィールドを除外したコピーを作成
      const { integrity, ...dataWithoutIntegrity } = definition;

      // オブジェクトを正規化（日付をISO文字列に変換）
      const normalized = this.normalizeObject(dataWithoutIntegrity);

      return normalized;
    } catch (error) {
      // 循環参照などのエラーの場合は空オブジェクトを返す
      return {};
    }
  }

  /**
   * オブジェクトを正規化
   * 日付をISO文字列に変換し、決定論的な形式にする
   */
  private normalizeObject(obj: unknown): unknown {
    if (obj === null || obj === undefined) {
      return obj;
    }

    if (obj instanceof Date) {
      // 日付をISO文字列に変換
      return obj.toISOString();
    }

    if (Array.isArray(obj)) {
      // 配列の各要素を正規化
      return obj.map(item => this.normalizeObject(item));
    }

    if (typeof obj === 'object') {
      // オブジェクトのプロパティをソートして正規化
      const normalized: Record<string, unknown> = {};
      const keys = Object.keys(obj).sort();
      
      for (const key of keys) {
        // 循環参照チェック
        if ((obj as Record<string, unknown>)[key] === obj) {
          normalized[key] = '[Circular]';
        } else {
          normalized[key] = this.normalizeObject((obj as Record<string, unknown>)[key]);
        }
      }
      
      return normalized;
    }

    return obj;
  }

  /**
   * ハッシュを計算
   * @param data - ハッシュ対象のデータ
   * @returns ハッシュ値（16進数文字列）
   */
  private computeHash(data: unknown): string {
    try {
      // データをJSON文字列に変換
      const jsonString = JSON.stringify(data);

      // SHA-256ハッシュを計算
      const hash = crypto.createHash(this.algorithm);
      hash.update(jsonString);
      
      return hash.digest(this.encoding);
    } catch (error) {
      // エラー時は空文字列のハッシュを返す
      const hash = crypto.createHash(this.algorithm);
      hash.update('');
      return hash.digest(this.encoding);
    }
  }

  /**
   * JSON.parse用のreviverで日付文字列をDateオブジェクトに変換
   */
  private dateReviver(key: string, value: unknown): unknown {
    // ISO 8601形式の日付文字列をDateオブジェクトに変換
    if (typeof value === 'string') {
      const datePattern = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/;
      if (datePattern.test(value)) {
        return new Date(value);
      }
    }
    return value;
  }
}