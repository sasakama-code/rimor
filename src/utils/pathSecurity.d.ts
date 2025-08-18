/**
 * パスセキュリティ関連のユーティリティ
 * パストラバーサル攻撃や不正なファイルアクセスを防ぐ
 */
export declare class PathSecurity {
    /**
     * プロジェクトルート内のパスかどうかを検証
     * @param resolvedPath 検証対象のパス
     * @param projectRoot プロジェクトルートパス
     * @returns プロジェクト内のパスの場合true
     */
    static validateProjectPath(resolvedPath: string, projectRoot: string): boolean;
    /**
     * ファイルパスを安全に解決し、プロジェクト範囲内であることを確認
     * @param filePath 対象ファイルパス
     * @param projectPath プロジェクトルートパス
     * @param context エラー時のコンテキスト情報
     * @returns 検証済みの解決されたパス、または null（不正なパスの場合）
     */
    static safeResolve(filePath: string, projectPath: string, context?: string): string | null;
    /**
     * 複数のファイルパスを一括で検証
     * @param filePaths 検証対象のファイルパス配列
     * @param projectPath プロジェクトルートパス
     * @returns 検証済みのファイルパス配列（不正なパスを除外）
     */
    static validateMultiplePaths(filePaths: string[], projectPath: string): string[];
    /**
     * 相対パスを安全に解決（import文の解決など）
     * @param importPath インポートパス
     * @param fromFile インポート元ファイル
     * @param projectPath プロジェクトルートパス
     * @returns 安全に解決されたパス、または null
     */
    static safeResolveImport(importPath: string, fromFile: string, projectPath: string): string | null;
    /**
     * ファイル拡張子を考慮した安全なパス解決
     * @param basePath ベースパス
     * @param extensions 試行する拡張子の配列
     * @param projectPath プロジェクトルートパス
     * @returns 最初に見つかった有効なファイルパス、または null
     */
    static safeResolveWithExtensions(basePath: string, extensions: string[], projectPath: string): string | null;
    /**
     * 絶対パスから個人情報（PII）をマスキングする
     * @param filePath マスキング対象のパス
     * @param projectName プロジェクト名（省略時は'PROJECT'）
     * @returns マスキングされたパス
     */
    static maskPII(filePath: string, projectName?: string): string;
    /**
     * 相対パスに変換（可能な場合）
     * @param absolutePath 絶対パス
     * @param basePath 基準パス（通常はprocess.cwd()）
     * @returns 相対パスまたはマスキングされた絶対パス
     */
    static toRelativeOrMasked(absolutePath: string, basePath?: string): string;
    /**
     * 文字列内のすべての絶対パスをマスキング
     * @param content マスキング対象の文字列
     * @param projectName プロジェクト名
     * @returns マスキングされた文字列
     */
    static maskAllPaths(content: string, projectName?: string): string;
}
//# sourceMappingURL=pathSecurity.d.ts.map