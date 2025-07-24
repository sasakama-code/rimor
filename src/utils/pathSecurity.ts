import * as path from 'path';
import { errorHandler, ErrorType } from './errorHandler';

/**
 * パスセキュリティ関連のユーティリティ
 * パストラバーサル攻撃や不正なファイルアクセスを防ぐ
 */
export class PathSecurity {
  /**
   * プロジェクトルート内のパスかどうかを検証
   * @param resolvedPath 検証対象のパス
   * @param projectRoot プロジェクトルートパス
   * @returns プロジェクト内のパスの場合true
   */
  static validateProjectPath(resolvedPath: string, projectRoot: string): boolean {
    try {
      const normalizedProjectRoot = path.resolve(projectRoot);
      const normalizedResolvedPath = path.resolve(resolvedPath);
      
      // プロジェクトルート内にあることを確認
      return normalizedResolvedPath.startsWith(normalizedProjectRoot);
    } catch {
      return false;
    }
  }

  /**
   * ファイルパスを安全に解決し、プロジェクト範囲内であることを確認
   * @param filePath 対象ファイルパス
   * @param projectPath プロジェクトルートパス
   * @param context エラー時のコンテキスト情報
   * @returns 検証済みの解決されたパス、または null（不正なパスの場合）
   */
  static safeResolve(filePath: string, projectPath: string, context?: string): string | null {
    try {
      const resolvedPath = path.resolve(projectPath, filePath);
      
      if (!this.validateProjectPath(resolvedPath, projectPath)) {
        errorHandler.handleError(
          new Error(`不正なファイルパス '${filePath}' がプロジェクト範囲外にアクセスしようとしました`),
          ErrorType.PERMISSION_DENIED,
          'セキュリティ警告: パストラバーサル攻撃の試行を検出しました',
          { filePath, projectPath, context },
          true
        );
        return null;
      }
      
      return resolvedPath;
    } catch (error) {
      errorHandler.handleError(
        error,
        ErrorType.SYSTEM_ERROR,
        'ファイルパス解決中にエラーが発生しました',
        { filePath, projectPath, context }
      );
      return null;
    }
  }

  /**
   * 複数のファイルパスを一括で検証
   * @param filePaths 検証対象のファイルパス配列
   * @param projectPath プロジェクトルートパス
   * @returns 検証済みのファイルパス配列（不正なパスを除外）
   */
  static validateMultiplePaths(filePaths: string[], projectPath: string): string[] {
    return filePaths.filter(filePath => {
      const resolved = path.resolve(projectPath, filePath);
      return this.validateProjectPath(resolved, projectPath);
    });
  }

  /**
   * 相対パスを安全に解決（import文の解決など）
   * @param importPath インポートパス
   * @param fromFile インポート元ファイル
   * @param projectPath プロジェクトルートパス
   * @returns 安全に解決されたパス、または null
   */
  static safeResolveImport(importPath: string, fromFile: string, projectPath: string): string | null {
    try {
      if (importPath.startsWith('.')) {
        const resolved = path.resolve(path.dirname(fromFile), importPath);
        return this.validateProjectPath(resolved, projectPath) ? resolved : null;
      }
      return importPath; // 相対パスでない場合はそのまま返す
    } catch {
      return null;
    }
  }

  /**
   * ファイル拡張子を考慮した安全なパス解決
   * @param basePath ベースパス
   * @param extensions 試行する拡張子の配列
   * @param projectPath プロジェクトルートパス
   * @returns 最初に見つかった有効なファイルパス、または null
   */
  static safeResolveWithExtensions(basePath: string, extensions: string[], projectPath: string): string | null {
    const fs = require('fs');
    
    for (const ext of extensions) {
      const withExt = basePath + ext;
      if (!this.validateProjectPath(withExt, projectPath)) {
        continue; // セキュリティチェック失敗
      }
      if (fs.existsSync(withExt)) {
        return withExt;
      }
    }
    
    // index.*を試す
    for (const ext of extensions) {
      const indexFile = path.join(basePath, `index${ext}`);
      if (!this.validateProjectPath(indexFile, projectPath)) {
        continue; // セキュリティチェック失敗
      }
      if (fs.existsSync(indexFile)) {
        return indexFile;
      }
    }
    
    return null;
  }
}