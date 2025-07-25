import { DictionaryBootstrap } from '../bootstrap/DictionaryBootstrap';
import { errorHandler, ErrorType } from '../../utils/errorHandler';
import * as fs from 'fs';
import * as path from 'path';

/**
 * ブートストラップコマンドの実装
 * プロジェクト初期化とセットアップウィザードを提供
 */
export class BootstrapCommand {
  
  /**
   * bootstrap init - 初期化ウィザードの実行
   */
  static async executeInit(options: {
    force?: boolean;
    auto?: boolean;
    template?: string;
    domain?: string;
  } = {}): Promise<void> {
    try {
      console.log('🚀 Rimor プロジェクト初期化を開始します...\n');
      
      // 既存の設定確認
      if (!options.force && await BootstrapCommand.hasExistingSetup()) {
        console.log('⚠️  既存の設定が見つかりました。');
        console.log('上書きする場合は --force オプションを使用してください。');
        console.log('例: rimor bootstrap init --force\n');
        return;
      }

      // 自動モードの処理
      if (options.auto) {
        await BootstrapCommand.executeAutoInit(options);
        return;
      }

      // インタラクティブモードの実行
      const bootstrap = new DictionaryBootstrap();
      await bootstrap.runBootstrap();
      
    } catch (error) {
      errorHandler.handleError(error, ErrorType.SYSTEM_ERROR, 'ブートストラップ初期化に失敗しました');
      process.exit(1);
    }
  }

  /**
   * bootstrap status - 現在のセットアップ状況の表示
   */
  static async executeStatus(): Promise<void> {
    try {
      console.log('📊 Rimor セットアップ状況\n');
      
      const projectRoot = process.cwd();
      const configPath = path.join(projectRoot, '.rimorrc.json');
      const dictionaryDir = path.join(projectRoot, '.rimor', 'dictionaries');
      
      // 設定ファイルの確認
      const hasConfig = fs.existsSync(configPath);
      console.log(`設定ファイル: ${hasConfig ? '✅ 存在' : '❌ 未作成'}`);
      
      if (hasConfig) {
        try {
          const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
          console.log(`  - ドメイン: ${config.project?.domain || '未設定'}`);
          console.log(`  - 言語: ${config.project?.language || '未設定'}`);
          console.log(`  - 辞書機能: ${config.dictionary?.enabled ? '有効' : '無効'}`);
        } catch (error) {
          console.log('  - ⚠️  設定ファイルの読み込みに失敗');
        }
      }
      
      // 辞書ディレクトリの確認
      const hasDictionaryDir = fs.existsSync(dictionaryDir);
      console.log(`辞書ディレクトリ: ${hasDictionaryDir ? '✅ 存在' : '❌ 未作成'}`);
      
      if (hasDictionaryDir) {
        const dictionaryFiles = fs.readdirSync(dictionaryDir)
          .filter(file => file.endsWith('.yaml') || file.endsWith('.yml'));
        console.log(`  - 辞書ファイル数: ${dictionaryFiles.length}`);
        
        if (dictionaryFiles.length > 0) {
          console.log('  - 辞書ファイル:');
          dictionaryFiles.forEach(file => {
            const filePath = path.join(dictionaryDir, file);
            const stats = fs.statSync(filePath);
            console.log(`    - ${file} (${Math.round(stats.size / 1024)}KB)`);
          });
        }
      }
      
      // キャッシュディレクトリの確認
      const cacheDir = path.join(projectRoot, '.rimor', 'cache');
      const hasCacheDir = fs.existsSync(cacheDir);
      console.log(`キャッシュディレクトリ: ${hasCacheDir ? '✅ 存在' : '❌ 未作成'}`);
      
      // 総合ステータス
      const isSetupComplete = hasConfig && hasDictionaryDir;
      console.log(`\n総合ステータス: ${isSetupComplete ? '✅ セットアップ完了' : '❌ セットアップ未完了'}`);
      
      if (!isSetupComplete) {
        console.log('\nセットアップを開始するには:');
        console.log('  rimor bootstrap init');
      }
      
    } catch (error) {
      errorHandler.handleError(error, ErrorType.SYSTEM_ERROR, 'ステータス確認に失敗しました');
    }
  }

  /**
   * bootstrap validate - セットアップの検証
   */
  static async executeValidate(): Promise<void> {
    try {
      console.log('🔍 Rimor セットアップの検証を開始します...\n');
      
      const projectRoot = process.cwd();
      let validationErrors: string[] = [];
      let validationWarnings: string[] = [];
      
      // 設定ファイルの検証
      const configValidation = await BootstrapCommand.validateConfiguration();
      validationErrors.push(...configValidation.errors);
      validationWarnings.push(...configValidation.warnings);
      
      // 辞書ファイルの検証
      const dictionaryValidation = await BootstrapCommand.validateDictionaries();
      validationErrors.push(...dictionaryValidation.errors);
      validationWarnings.push(...dictionaryValidation.warnings);
      
      // プロジェクト構造の検証
      const structureValidation = await BootstrapCommand.validateProjectStructure();
      validationErrors.push(...structureValidation.errors);
      validationWarnings.push(...structureValidation.warnings);
      
      // 結果の表示
      console.log('📊 検証結果:');
      
      if (validationErrors.length === 0) {
        console.log('✅ エラーなし');
      } else {
        console.log(`❌ エラー: ${validationErrors.length}件`);
        validationErrors.forEach(error => console.log(`  - ${error}`));
      }
      
      if (validationWarnings.length === 0) {
        console.log('✅ 警告なし');
      } else {
        console.log(`⚠️  警告: ${validationWarnings.length}件`);
        validationWarnings.forEach(warning => console.log(`  - ${warning}`));
      }
      
      console.log(`\n総合評価: ${validationErrors.length === 0 ? '✅ 良好' : '❌ 要修正'}`);
      
      if (validationErrors.length > 0) {
        console.log('\n修正方法:');
        console.log('  rimor bootstrap init --force  # 再セットアップ');
      }
      
    } catch (error) {
      errorHandler.handleError(error, ErrorType.SYSTEM_ERROR, 'セットアップ検証に失敗しました');
    }
  }

  /**
   * bootstrap clean - セットアップのクリーンアップ
   */
  static async executeClean(options: { confirm?: boolean } = {}): Promise<void> {
    try {
      if (!options.confirm) {
        console.log('⚠️  この操作により以下が削除されます:');
        console.log('  - .rimorrc.json (設定ファイル)');
        console.log('  - .rimor/ (辞書とキャッシュ)');
        console.log('\n実行するには --confirm オプションを追加してください:');
        console.log('  rimor bootstrap clean --confirm');
        return;
      }
      
      console.log('🧹 Rimor セットアップのクリーンアップを開始します...');
      
      const projectRoot = process.cwd();
      const configPath = path.join(projectRoot, '.rimorrc.json');
      const rimorDir = path.join(projectRoot, '.rimor');
      
      let cleaned = 0;
      
      // 設定ファイルの削除
      if (fs.existsSync(configPath)) {
        fs.unlinkSync(configPath);
        console.log('✅ 設定ファイルを削除しました');
        cleaned++;
      }
      
      // .rimorディレクトリの削除
      if (fs.existsSync(rimorDir)) {
        fs.rmSync(rimorDir, { recursive: true });
        console.log('✅ .rimorディレクトリを削除しました');
        cleaned++;
      }
      
      if (cleaned === 0) {
        console.log('ℹ️  削除対象のファイルが見つかりませんでした');
      } else {
        console.log(`\n✅ クリーンアップが完了しました (${cleaned}件削除)`);
      }
      
    } catch (error) {
      errorHandler.handleError(error, ErrorType.SYSTEM_ERROR, 'クリーンアップに失敗しました');
    }
  }

  // ========================================
  // プライベートメソッド
  // ========================================

  /**
   * 既存セットアップの確認
   */
  private static async hasExistingSetup(): Promise<boolean> {
    const projectRoot = process.cwd();
    const configPath = path.join(projectRoot, '.rimorrc.json');
    const dictionaryDir = path.join(projectRoot, '.rimor', 'dictionaries');
    
    return fs.existsSync(configPath) || 
           (fs.existsSync(dictionaryDir) && fs.readdirSync(dictionaryDir).length > 0);
  }

  /**
   * 自動初期化の実行
   */
  private static async executeAutoInit(options: {
    template?: string;
    domain?: string;
  }): Promise<void> {
    console.log('🤖 自動モードでセットアップを実行します...');
    
    // デフォルト設定の準備
    const projectInfo = {
      domain: options.domain || 'default',
      language: 'typescript',
      framework: 'jest',
      projectType: 'web'
    };

    // テンプレートベースのセットアップ
    const template = options.template || 'basic';
    
    try {
      // TODO: テンプレートシステムの実装
      console.log(`📋 テンプレート "${template}" を使用してセットアップします`);
      console.log('💡 完全な自動セットアップは今後の実装で対応予定です');
      console.log('現在は手動モードをご使用ください:');
      console.log('  rimor bootstrap init');
      
    } catch (error) {
      console.warn('自動セットアップに失敗しました。手動モードを使用してください。');
      throw error;
    }
  }

  /**
   * 設定ファイルの検証
   */
  private static async validateConfiguration(): Promise<{
    errors: string[];
    warnings: string[];
  }> {
    const errors: string[] = [];
    const warnings: string[] = [];
    
    const configPath = path.join(process.cwd(), '.rimorrc.json');
    
    if (!fs.existsSync(configPath)) {
      errors.push('設定ファイル (.rimorrc.json) が見つかりません');
      return { errors, warnings };
    }
    
    try {
      const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
      
      // 必須フィールドの確認
      if (!config.version) {
        warnings.push('設定ファイルにversionフィールドがありません');
      }
      
      if (!config.project?.domain) {
        errors.push('プロジェクトドメインが設定されていません');
      }
      
      if (!config.dictionary?.enabled) {
        warnings.push('辞書機能が無効になっています');
      }
      
    } catch (error) {
      errors.push('設定ファイルの形式が不正です');
    }
    
    return { errors, warnings };
  }

  /**
   * 辞書ファイルの検証
   */
  private static async validateDictionaries(): Promise<{
    errors: string[];
    warnings: string[];
  }> {
    const errors: string[] = [];
    const warnings: string[] = [];
    
    const dictionaryDir = path.join(process.cwd(), '.rimor', 'dictionaries');
    
    if (!fs.existsSync(dictionaryDir)) {
      errors.push('辞書ディレクトリが見つかりません');
      return { errors, warnings };
    }
    
    const dictionaryFiles = fs.readdirSync(dictionaryDir)
      .filter(file => file.endsWith('.yaml') || file.endsWith('.yml'));
    
    if (dictionaryFiles.length === 0) {
      warnings.push('辞書ファイルが見つかりません');
      return { errors, warnings };
    }
    
    for (const file of dictionaryFiles) {
      const filePath = path.join(dictionaryDir, file);
      const stats = fs.statSync(filePath);
      
      // ファイルサイズチェック
      if (stats.size === 0) {
        errors.push(`辞書ファイル ${file} が空です`);
      }
      
      // 最低限のYAML構造チェック（簡易）
      try {
        const content = fs.readFileSync(filePath, 'utf-8');
        if (!content.includes('terms:') && !content.includes('businessRules:')) {
          warnings.push(`辞書ファイル ${file} に標準的な構造が見つかりません`);
        }
      } catch (error) {
        errors.push(`辞書ファイル ${file} の読み込みに失敗しました`);
      }
    }
    
    return { errors, warnings };
  }

  /**
   * プロジェクト構造の検証
   */
  private static async validateProjectStructure(): Promise<{
    errors: string[];
    warnings: string[];
  }> {
    const errors: string[] = [];
    const warnings: string[] = [];
    
    const projectRoot = process.cwd();
    
    // package.jsonの確認
    const packageJsonPath = path.join(projectRoot, 'package.json');
    if (!fs.existsSync(packageJsonPath)) {
      warnings.push('package.jsonが見つかりません（Node.jsプロジェクトではない可能性）');
    }
    
    // srcディレクトリの確認
    const srcDir = path.join(projectRoot, 'src');
    if (!fs.existsSync(srcDir)) {
      warnings.push('srcディレクトリが見つかりません');
    }
    
    // テストファイルの確認
    const hasTestFiles = fs.existsSync(path.join(projectRoot, 'test')) ||
                        fs.existsSync(path.join(projectRoot, 'tests')) ||
                        fs.existsSync(path.join(projectRoot, '__tests__'));
    
    if (!hasTestFiles) {
      warnings.push('テストディレクトリが見つかりません');
    }
    
    return { errors, warnings };
  }
}