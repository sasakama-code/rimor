import * as fs from 'fs';
import * as path from 'path';

/**
 * Node.js互換性ヘルパー
 * fs.rmSyncはNode.js 14.14.0以降でのみ利用可能なため、
 * 古いバージョンとの互換性を保つためのフォールバック実装
 */
export class FsCompat {
  /**
   * Node.jsのバージョンチェック
   */
  private static isRmSyncAvailable(): boolean {
    const version = process.version;
    const match = version.match(/^v(\d+)\.(\d+)\.(\d+)/);
    if (!match) return false;
    
    const major = parseInt(match[1], 10);
    const minor = parseInt(match[2], 10);
    const patch = parseInt(match[3], 10);
    
    // fs.rmSyncはNode.js 14.14.0以降で利用可能
    return major > 14 || (major === 14 && minor > 14) || (major === 14 && minor === 14 && patch >= 0);
  }

  /**
   * 互換性を考慮したディレクトリ削除
   */
  static removeSync(targetPath: string, options?: { recursive?: boolean; force?: boolean }): void {
    if (!fs.existsSync(targetPath)) {
      return;
    }

    // fs.rmSyncが利用可能な場合は使用
    if (this.isRmSyncAvailable() && typeof (fs as any).rmSync === 'function') {
      (fs as any).rmSync(targetPath, options);
      return;
    }

    // フォールバック実装
    this.removeRecursiveSync(targetPath, options?.force || false);
  }

  /**
   * 再帰的削除のフォールバック実装
   */
  private static removeRecursiveSync(targetPath: string, force: boolean): void {
    try {
      const stat = fs.statSync(targetPath);
      
      if (stat.isDirectory()) {
        // ディレクトリの場合、中身を先に削除
        const items = fs.readdirSync(targetPath);
        for (const item of items) {
          const itemPath = path.join(targetPath, item);
          this.removeRecursiveSync(itemPath, force);
        }
        fs.rmdirSync(targetPath);
      } else {
        // ファイルの場合
        fs.unlinkSync(targetPath);
      }
    } catch (error) {
      if (!force) {
        throw error;
      }
      // force=trueの場合はエラーを無視
    }
  }

  /**
   * 安全なディレクトリ作成
   */
  static ensureDirSync(dirPath: string): void {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
  }

  /**
   * 安全なファイル削除
   */
  static removeFileSync(filePath: string, force: boolean = false): void {
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch (error) {
      if (!force) {
        throw error;
      }
    }
  }
}