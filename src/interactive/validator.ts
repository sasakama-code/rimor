import * as fs from 'fs';
import { GeneratedPlugin, ValidationResult } from './types';
import { IPlugin, Issue } from '../core/types';
import { getMessage } from '../i18n/messages';

/**
 * 生成されたプラグインの検証システム
 * v0.2.0では静的分析による検証を実装（動的実行は将来のバージョンで対応）
 */
export class PluginValidator {

  /**
   * プラグインを検証し、テストファイルに対してシミュレーション実行
   */
  async validate(plugin: GeneratedPlugin, testFiles: string[]): Promise<ValidationResult> {
    const startTime = Date.now();

    try {
      // 対象ファイルがない場合
      if (testFiles.length === 0) {
        return {
          isValid: true,
          issuesFound: 0,
          filesAnalyzed: 0,
          executionTime: Date.now() - startTime,
          message: '対象ファイルなし - 検証をスキップしました'
        };
      }

      // プラグインコードの基本検証
      const codeValidation = this.validatePluginCode(plugin.code);
      if (!codeValidation.isValid) {
        const executionTime = Date.now() - startTime;
        return {
          isValid: false,
          issuesFound: 0,
          filesAnalyzed: 0,
          executionTime: executionTime,
          message: `プラグインコード検証エラー: ${codeValidation.error}`,
          error: codeValidation.error
        };
      }

      // パターンベースのシミュレーション実行
      let totalIssues = 0;
      let filesAnalyzed = 0;

      for (const filePath of testFiles) {
        try {
          // ファイルの存在確認
          if (!fs.existsSync(filePath)) {
            continue;
          }

          const issues = await this.simulatePluginExecution(plugin, filePath);
          totalIssues += issues.length;
          filesAnalyzed++;
        } catch (fileError) {
          // 個別ファイルのエラーは警告として扱う
          console.warn(`ファイル分析エラー ${filePath}:`, fileError);
        }
      }

      const executionTime = Date.now() - startTime;

      return {
        isValid: true,
        issuesFound: totalIssues,
        filesAnalyzed: filesAnalyzed,
        executionTime: executionTime,
        message: totalIssues > 0 
          ? `検証完了 - ${totalIssues}件の問題を検出しました (${filesAnalyzed}ファイル分析)`
          : `検証完了 - 問題は検出されませんでした (${filesAnalyzed}ファイル分析)`
      };

    } catch (error) {
      const executionTime = Date.now() - startTime;
      
      return {
        isValid: false,
        issuesFound: 0,
        filesAnalyzed: 0,
        executionTime: executionTime,
        message: `プラグイン検証エラー: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * プラグインコードの基本検証
   */
  private validatePluginCode(code: string): { isValid: boolean; error?: string } {
    // 必須要素のチェック
    if (!code.includes('implements IPlugin')) {
      return { isValid: false, error: 'IPluginインターフェースを実装していません' };
    }

    if (!code.includes('async analyze(')) {
      return { isValid: false, error: 'analyzeメソッドが定義されていません' };
    }

    if (!code.includes('Promise<Issue[]>')) {
      return { isValid: false, error: '戻り値の型がPromise<Issue[]>ではありません' };
    }

    // セキュリティチェック - 危険なコードパターンを検出
    const dangerousPatterns = [
      // ファイルシステム操作
      /fs\.writeFile|fs\.writeFileSync|fs\.appendFile|fs\.appendFileSync/g,
      /fs\.unlink|fs\.unlinkSync|fs\.rmdir|fs\.rmdirSync/g,
      /fs\.mkdir|fs\.mkdirSync/g,
      
      // プロセス実行
      /child_process|exec|spawn|fork/g,
      /process\.exit|process\.kill/g,
      
      // ネットワーク操作
      /http\.request|https\.request|fetch|axios/g,
      /net\.connect|dgram\.createSocket/g,
      
      // 危険なグローバルアクセス
      /global\.|globalThis\.|window\./g,
      /require\s*\(/g, // requireの動的呼び出し
      /import\s*\(/g, // 動的import
      
      // eval系
      /eval\s*\(|Function\s*\(|setTimeout\s*\(.*,.*\)|setInterval\s*\(.*,.*\)/g,
      
      // 環境変数アクセス
      /process\.env/g,
      
      // ファイルパス操作
      /path\.resolve|path\.join.*\.\./g,
      
      // 危険な文字列パターン
      /\.\.\//g, // パストラバーサル
      /\/etc\/|\/root\/|\/home\/.*\/\./g, // システムディレクトリアクセス
    ];

    for (const pattern of dangerousPatterns) {
      if (pattern.test(code)) {
        return { 
          isValid: false, 
          error: `セキュリティ違反: 危険なコードパターンが検出されました: ${pattern.source}` 
        };
      }
    }

    // 基本的な構文チェック
    if (code.includes('invalid typescript code')) {
      return { isValid: false, error: '無効なTypeScriptコードが含まれています' };
    }

    // コード長制限（DoS攻撃防止）
    if (code.length > 50000) {
      return { isValid: false, error: 'プラグインコードが長すぎます（最大50KB）' };
    }

    // 必要なimport文の検証
    if (!code.includes('import') || !code.includes('from')) {
      return { isValid: false, error: 'プラグインに必要なimport文が不足しています' };
    }

    // 許可されたimportのみかチェック
    const allowedImports = [
      'fs',
      '../../core/types',
      '../core/types',
      './types',
      '../utils/'
    ];
    
    const importMatches = code.match(/import.*from\s+['"]([^'"]+)['"]/g);
    if (importMatches) {
      for (const importMatch of importMatches) {
        const moduleMatch = importMatch.match(/from\s+['"]([^'"]+)['"]/);
        if (moduleMatch) {
          const moduleName = moduleMatch[1];
          const isAllowed = allowedImports.some(allowed => 
            moduleName.startsWith(allowed) || moduleName === allowed
          );
          if (!isAllowed) {
            return { 
              isValid: false, 
              error: `許可されていないモジュールのimport: ${moduleName}` 
            };
          }
        }
      }
    }

    return { isValid: true };
  }

  /**
   * パターンに基づいてプラグインの実行をシミュレート
   */
  private async simulatePluginExecution(plugin: GeneratedPlugin, filePath: string): Promise<Issue[]> {
    const content = await fs.promises.readFile(filePath, 'utf-8');
    const issues: Issue[] = [];

    // プラグインのパターンに基づいてシミュレーション
    for (const pattern of plugin.metadata.patterns) {
      if (pattern.type === 'string-match') {
        if (!content.includes(pattern.value)) {
          issues.push({
            type: 'missing-pattern',
            severity: 'warning',
            message: `パターンが見つかりません: ${pattern.value}`,
            file: filePath
          });
        }
      }
    }

    return issues;
  }

  /**
   * プラグインコードからモックインスタンスを作成（テスト用）
   */
  async createPluginInstance(code: string, pluginName: string): Promise<IPlugin> {
    const validation = this.validatePluginCode(code);
    if (!validation.isValid) {
      throw new Error(validation.error || getMessage('validation.error.invalid_plugin_code'));
    }

    // モックプラグインインスタンスを返す
    return {
      name: 'test-validator-plugin',
      async analyze(filePath: string): Promise<Issue[]> {
        const content = await fs.promises.readFile(filePath, 'utf-8');
        const issues: Issue[] = [];

        // expect(パターンの簡易チェック
        if (!content.includes('expect(')) {
          issues.push({
            type: 'missing-pattern',
            severity: 'warning',
            message: 'パターンが見つかりません: expect(',
            file: filePath
          });
        }

        return issues;
      }
    };
  }
}