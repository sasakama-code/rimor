import { readdir } from 'fs/promises';
import { resolve } from 'path';

export async function* findTestFiles(
  dir: string,
  excludePatterns: string[] = [],
  projectRoot?: string,
  depth: number = 0
): AsyncGenerator<string> {
  // セキュリティ: 探索深度制限（無限再帰防止）
  if (depth > 20) {
    return;
  }

  // セキュリティ: プロジェクトルートの設定
  if (!projectRoot) {
    projectRoot = process.cwd();
  }

  // セキュリティ: パス検証
  const { PathSecurity } = await import('../utils/pathSecurity');
  if (!PathSecurity.validateProjectPath(dir, projectRoot)) {
    console.warn(`セキュリティ警告: プロジェクト範囲外のディレクトリをスキップ: ${dir}`);
    return;
  }

  try {
    const dirents = await readdir(dir, { withFileTypes: true });
  
    for (const dirent of dirents) {
      // セキュリティ: ファイル名の検証
      if (!isValidFileName(dirent.name)) {
        continue;
      }

      const path = resolve(dir, dirent.name);
      
      // セキュリティ: 解決されたパスの検証
      if (!PathSecurity.validateProjectPath(path, projectRoot)) {
        continue;
      }
      
      // 除外パターンの検証（より安全な方法）
      if (shouldExcludePath(path, excludePatterns)) {
        continue;
      }
      
      if (dirent.isDirectory()) {
        // セキュリティ: シンボリックリンクのスキップ
        if (dirent.isSymbolicLink()) {
          continue;
        }

        if (dirent.name === '__tests__') {
          const nestedDirents = await readdir(path, { withFileTypes: true });
          for (const nested of nestedDirents) {
            if (nested.isFile() && isValidFileName(nested.name)) {
              const nestedPath = resolve(path, nested.name);
              if (PathSecurity.validateProjectPath(nestedPath, projectRoot)) {
                yield nestedPath;
              }
            }
          }
        } else {
          yield* findTestFiles(path, excludePatterns, projectRoot, depth + 1);
        }
      } else if (dirent.isFile() && isTestFile(dirent.name)) {
        yield path;
      }
    }
  } catch (error) {
    // ディレクトリアクセスエラーは警告として処理
    console.warn(`ディレクトリアクセスエラー: ${dir}`, error);
  }
}

/**
 * 安全な除外パターンチェック
 */
function shouldExcludePath(path: string, excludePatterns: string[]): boolean {
  // セキュリティ: 除外パターンの検証
  const safePatterns = excludePatterns.filter(pattern => 
    typeof pattern === 'string' && 
    pattern.length > 0 && 
    pattern.length < 200 &&
    !pattern.includes('..') &&
    !/[<>:"|?*]/.test(pattern)
  );

  return safePatterns.some(pattern => {
    // 単純な文字列マッチのみ使用（正規表現を避ける）
    return path.includes(pattern);
  });
}

/**
 * ファイル名の安全性チェック
 */
function isValidFileName(filename: string): boolean {
  // 基本的な検証
  if (!filename || filename.length === 0 || filename.length > 255) {
    return false;
  }

  // 危険なファイル名パターンの検出
  const dangerousPatterns = [
    /^\./,  // 隠しファイル（制限）
    /\0/,   // NULL文字
    /[<>:"|?*]/,  // Windows不正文字
    /^(CON|PRN|AUX|NUL|COM[1-9]|LPT[1-9])$/i,  // Windows予約名
    /\.\./,  // パストラバーサル
  ];

  for (const pattern of dangerousPatterns) {
    if (pattern.test(filename)) {
      return false;
    }
  }

  return true;
}

export function isTestFile(filename: string): boolean {
  return /\.(test|spec)\.(js|ts)$/.test(filename);
}