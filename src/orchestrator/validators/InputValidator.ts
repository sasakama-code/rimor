/**
 * 入力値バリデーター
 * 単一責任の原則（SRP）：バリデーション責務を分離
 * Defensive Programming原則：堅牢な入力値検証
 */

import * as fs from 'fs';
import { IInputValidator } from '../interfaces';
import { OrchestratorError, OrchestratorConfig } from '../types';

export class InputValidator implements IInputValidator {
  /**
   * パスの妥当性を検証
   */
  validatePath(path: string): void {
    if (!path) {
      throw new OrchestratorError('パスが指定されていません', 'validation');
    }

    if (typeof path !== 'string') {
      throw new OrchestratorError('パスは文字列である必要があります', 'validation');
    }

    if (path.trim().length === 0) {
      throw new OrchestratorError('パスが空文字列です', 'validation');
    }

    // セキュリティチェック：パストラバーサル対策
    if (path.includes('..')) {
      throw new OrchestratorError('相対パス（..）は許可されていません', 'security');
    }

    // NULL文字インジェクション対策
    if (path.includes('\0')) {
      throw new OrchestratorError('NULL文字を含むパスは許可されていません', 'security');
    }

    // 存在確認
    try {
      if (!fs.existsSync(path)) {
        throw new OrchestratorError('指定されたパスが存在しません', 'validation');
      }
    } catch (error) {
      if (error instanceof OrchestratorError) {
        throw error;
      }
      throw new OrchestratorError(
        `パスアクセスエラー: ${error instanceof Error ? error.message : String(error)}`,
        'filesystem',
        error instanceof Error ? error : undefined
      );
    }

    // ディレクトリ確認
    try {
      const stat = fs.statSync(path);
      if (!stat.isDirectory()) {
        throw new OrchestratorError('指定されたパスはディレクトリではありません', 'validation');
      }
    } catch (error) {
      if (error instanceof OrchestratorError) {
        throw error;
      }
      throw new OrchestratorError(
        `ディレクトリ確認エラー: ${error instanceof Error ? error.message : String(error)}`,
        'filesystem',
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * 設定の妥当性を検証
   */
  validateConfig(config: unknown): void {
    if (!config) {
      return; // 設定はオプショナルなので null/undefined は許可
    }

    if (typeof config !== 'object') {
      throw new OrchestratorError('設定はオブジェクトである必要があります', 'validation');
    }

    const typedConfig = config as Partial<OrchestratorConfig>;

    // ブール値設定の検証
    if (typedConfig.enableTaintAnalysis !== undefined && typeof typedConfig.enableTaintAnalysis !== 'boolean') {
      throw new OrchestratorError('enableTaintAnalysisはブール値である必要があります', 'validation');
    }

    if (typedConfig.enableIntentExtraction !== undefined && typeof typedConfig.enableIntentExtraction !== 'boolean') {
      throw new OrchestratorError('enableIntentExtractionはブール値である必要があります', 'validation');
    }

    if (typedConfig.enableGapDetection !== undefined && typeof typedConfig.enableGapDetection !== 'boolean') {
      throw new OrchestratorError('enableGapDetectionはブール値である必要があります', 'validation');
    }

    if (typedConfig.enableNistEvaluation !== undefined && typeof typedConfig.enableNistEvaluation !== 'boolean') {
      throw new OrchestratorError('enableNistEvaluationはブール値である必要があります', 'validation');
    }

    if (typedConfig.parallelExecution !== undefined && typeof typedConfig.parallelExecution !== 'boolean') {
      throw new OrchestratorError('parallelExecutionはブール値である必要があります', 'validation');
    }

    // 数値設定の検証
    if (typedConfig.timeoutMs !== undefined) {
      if (typeof typedConfig.timeoutMs !== 'number') {
        throw new OrchestratorError('timeoutMsは数値である必要があります', 'validation');
      }

      if (typedConfig.timeoutMs <= 0) {
        throw new OrchestratorError('timeoutMsは正の数である必要があります', 'validation');
      }

      if (typedConfig.timeoutMs > 300000) { // 5分
        throw new OrchestratorError('timeoutMsは5分（300000ms）以下である必要があります', 'validation');
      }
    }
  }
}