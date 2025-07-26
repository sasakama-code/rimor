import { DictionaryBootstrap } from '../../src/cli/bootstrap/DictionaryBootstrap';
import { BootstrapCommand } from '../../src/cli/commands/bootstrap';
import { DictionaryLoader } from '../../src/dictionary/storage/loader';
import { DomainDictionary } from '../../src/core/types';
import * as fs from 'fs';
import * as path from 'path';

// モックを設定
jest.mock('readline', () => ({
  createInterface: () => ({
    question: jest.fn(),
    close: jest.fn()
  })
}));

describe('Bootstrap Functionality', () => {
  let tempDir: string;
  let originalCwd: string;

  beforeAll(() => {
    originalCwd = process.cwd();
    // テスト用一時ディレクトリの作成
    tempDir = path.join(__dirname, '../fixtures/bootstrap');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
  });

  afterAll(() => {
    // 元のディレクトリに戻す
    process.chdir(originalCwd);
    
    // テスト用ディレクトリのクリーンアップ
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true });
    }
  });

  beforeEach(() => {
    // 各テストで一時ディレクトリに移動
    process.chdir(tempDir);
    
    // 一時ディレクトリ内のファイルをクリーンアップ
    const files = fs.readdirSync(tempDir);
    files.forEach(file => {
      const filePath = path.join(tempDir, file);
      if (fs.statSync(filePath).isDirectory()) {
        fs.rmSync(filePath, { recursive: true });
      } else {
        fs.unlinkSync(filePath);
      }
    });
  });

  describe('DictionaryBootstrap', () => {
    test('基本辞書の作成', () => {
      const bootstrap = new DictionaryBootstrap(tempDir);
      
      const projectInfo = {
        domain: 'test',
        language: 'typescript',
        framework: 'jest',
        projectType: 'web'
      };
      
      // privateメソッドにアクセスするために型アサーション
      const basicDictionary: DomainDictionary = (bootstrap as any).createBasicDictionary(projectInfo);
      
      expect(basicDictionary).toBeDefined();
      expect(basicDictionary.domain).toBe('test');
      expect(basicDictionary.version).toBe('1.0.0');
      expect(basicDictionary.terms.length).toBeGreaterThan(0);
      
      // 基本用語が含まれることを確認
      const userTerm = basicDictionary.terms.find(term => term.term === 'User');
      expect(userTerm).toBeDefined();
      expect(userTerm?.importance).toBe('high');
      
      bootstrap.close();
    });

    test('ドメイン固有用語の取得', () => {
      const bootstrap = new DictionaryBootstrap(tempDir);
      
      // ecommerceドメインの用語取得
      const ecommerceTerms: Array<any> = (bootstrap as any).getBasicTermsForDomain('ecommerce');
      expect(ecommerceTerms.length).toBeGreaterThan(1);
      
      const productTerm = ecommerceTerms.find((term: any) => term.term === 'Product');
      expect(productTerm).toBeDefined();
      
      const paymentTerm = ecommerceTerms.find((term: any) => term.term === 'Payment');
      expect(paymentTerm).toBeDefined();
      expect(paymentTerm?.category).toBe('financial');
      
      // financialドメインの用語取得
      const financialTerms: Array<any> = (bootstrap as any).getBasicTermsForDomain('financial');
      const transactionTerm = financialTerms.find((term: any) => term.term === 'Transaction');
      expect(transactionTerm).toBeDefined();
      
      bootstrap.close();
    });

    test('設定ファイルの生成', async () => {
      const bootstrap = new DictionaryBootstrap(tempDir);
      
      const projectInfo = {
        domain: 'test-domain',
        language: 'typescript',
        framework: 'jest',
        projectType: 'web'
      };
      
      const testDictionary: DomainDictionary = (bootstrap as any).createBasicDictionary(projectInfo);
      
      // 設定ファイル生成を実行
      await (bootstrap as any).generateConfiguration(projectInfo, testDictionary);
      
      // 設定ファイルが作成されることを確認
      const configPath = path.join(tempDir, '.rimorrc.json');
      expect(fs.existsSync(configPath)).toBe(true);
      
      const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
      expect(config.project.domain).toBe('test-domain');
      expect(config.project.language).toBe('typescript');
      expect(config.dictionary.enabled).toBe(true);
      expect(config.bootstrap.completed).toBe(true);
      
      // 辞書ディレクトリが作成されることを確認
      const dictionaryDir = path.join(tempDir, '.rimor', 'dictionaries');
      expect(fs.existsSync(dictionaryDir)).toBe(true);
      
      // 辞書ファイルが保存されることを確認
      const dictionaryPath = path.join(dictionaryDir, 'test-domain.yaml');
      expect(fs.existsSync(dictionaryPath)).toBe(true);
      
      bootstrap.close();
    });

    test('既存設定の確認', async () => {
      const bootstrap = new DictionaryBootstrap(tempDir);
      
      // 初期状態では設定なし
      const hasConfigInitial: boolean = await (bootstrap as any).checkExistingConfiguration();
      expect(hasConfigInitial).toBe(false);
      
      // 設定ファイルを作成
      const configPath = path.join(tempDir, '.rimorrc.json');
      fs.writeFileSync(configPath, JSON.stringify({ test: true }), 'utf-8');
      
      const hasConfigAfter: boolean = await (bootstrap as any).checkExistingConfiguration();
      expect(hasConfigAfter).toBe(true);
      
      bootstrap.close();
    });
  });

  describe('BootstrapCommand', () => {
    test('ステータス確認コマンド', async () => {
      // コンソール出力をキャプチャ
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      await BootstrapCommand.executeStatus();
      
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('📊 Rimor セットアップ状況'));
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('設定ファイル: ❌ 未作成'));
      
      consoleSpy.mockRestore();
    });

    test('検証コマンド - 設定なしの場合', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      await BootstrapCommand.executeValidate();
      
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('🔍 Rimor セットアップの検証を開始します'));
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('❌ エラー:'));
      
      consoleSpy.mockRestore();
    });

    test('クリーンアップコマンド - 確認なしの場合', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      await BootstrapCommand.executeClean({ confirm: false });
      
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('⚠️  この操作により以下が削除されます'));
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('--confirm オプションを追加してください'));
      
      consoleSpy.mockRestore();
    });

    test('クリーンアップコマンド - 確認ありの場合', async () => {
      // テスト用ファイルを作成
      const configPath = path.join(tempDir, '.rimorrc.json');
      const rimorDir = path.join(tempDir, '.rimor');
      
      fs.writeFileSync(configPath, JSON.stringify({ test: true }), 'utf-8');
      fs.mkdirSync(rimorDir, { recursive: true });
      fs.writeFileSync(path.join(rimorDir, 'test.txt'), 'test', 'utf-8');
      
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      await BootstrapCommand.executeClean({ confirm: true });
      
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('🧹 Rimor セットアップのクリーンアップを開始します'));
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('✅ 設定ファイルを削除しました'));
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('✅ .rimorディレクトリを削除しました'));
      
      // ファイルが削除されることを確認
      expect(fs.existsSync(configPath)).toBe(false);
      expect(fs.existsSync(rimorDir)).toBe(false);
      
      consoleSpy.mockRestore();
    });

    test('既存セットアップの検出', async () => {
      // 設定ファイルが存在しない場合
      const hasSetupInitial: boolean = await (BootstrapCommand as any).hasExistingSetup();
      expect(hasSetupInitial).toBe(false);
      
      // 設定ファイルを作成
      const configPath = path.join(tempDir, '.rimorrc.json');
      fs.writeFileSync(configPath, '{}', 'utf-8');
      
      const hasSetupAfter: boolean = await (BootstrapCommand as any).hasExistingSetup();
      expect(hasSetupAfter).toBe(true);
    });

    test('設定ファイルの検証', async () => {
      // 設定ファイルが存在しない場合
      const validationEmpty: any = await (BootstrapCommand as any).validateConfiguration();
      expect(validationEmpty.errors.length).toBeGreaterThan(0);
      expect(validationEmpty.errors[0]).toContain('設定ファイル (.rimorrc.json) が見つかりません');
      
      // 不完全な設定ファイルの場合
      const configPath = path.join(tempDir, '.rimorrc.json');
      fs.writeFileSync(configPath, JSON.stringify({
        version: '1.0.0'
        // project.domainが不足
      }), 'utf-8');
      
      const validationIncomplete: any = await (BootstrapCommand as any).validateConfiguration();
      expect(validationIncomplete.errors.some((err: string) => err.includes('プロジェクトドメインが設定されていません'))).toBe(true);
      
      // 完全な設定ファイルの場合
      fs.writeFileSync(configPath, JSON.stringify({
        version: '1.0.0',
        project: {
          domain: 'test-domain'
        },
        dictionary: {
          enabled: true
        }
      }), 'utf-8');
      
      const validationComplete: any = await (BootstrapCommand as any).validateConfiguration();
      expect(validationComplete.errors.length).toBe(0);
    });

    test('辞書ファイルの検証', async () => {
      // 辞書ディレクトリが存在しない場合
      const validationNoDir: any = await (BootstrapCommand as any).validateDictionaries();
      expect(validationNoDir.errors.length).toBeGreaterThan(0);
      expect(validationNoDir.errors[0]).toContain('辞書ディレクトリが見つかりません');
      
      // 辞書ディレクトリは存在するが辞書ファイルがない場合
      const dictionaryDir = path.join(tempDir, '.rimor', 'dictionaries');
      fs.mkdirSync(dictionaryDir, { recursive: true });
      
      const validationNoFiles: any = await (BootstrapCommand as any).validateDictionaries();
      expect(validationNoFiles.warnings.some((warn: string) => warn.includes('辞書ファイルが見つかりません'))).toBe(true);
      
      // 空の辞書ファイルがある場合
      const dictionaryPath = path.join(dictionaryDir, 'test.yaml');
      fs.writeFileSync(dictionaryPath, '', 'utf-8');
      
      const validationEmptyFile: any = await (BootstrapCommand as any).validateDictionaries();
      expect(validationEmptyFile.errors.some((err: string) => err.includes('辞書ファイル test.yaml が空です'))).toBe(true);
      
      // 有効な辞書ファイルがある場合
      fs.writeFileSync(dictionaryPath, 'terms:\n  - id: test\nbuisiness rules: []', 'utf-8');
      
      const validationValidFile: any = await (BootstrapCommand as any).validateDictionaries();
      expect(validationValidFile.errors.length).toBe(0);
    });

    test('プロジェクト構造の検証', async () => {
      const validation: any = await (BootstrapCommand as any).validateProjectStructure();
      
      // package.jsonがない場合の警告
      expect(validation.warnings.some((warn: string) => warn.includes('package.jsonが見つかりません'))).toBe(true);
      
      // srcディレクトリがない場合の警告
      expect(validation.warnings.some((warn: string) => warn.includes('srcディレクトリが見つかりません'))).toBe(true);
      
      // テストディレクトリがない場合の警告
      expect(validation.warnings.some((warn: string) => warn.includes('テストディレクトリが見つかりません'))).toBe(true);
      
      // package.jsonを作成
      fs.writeFileSync(path.join(tempDir, 'package.json'), '{}', 'utf-8');
      
      // srcディレクトリを作成
      fs.mkdirSync(path.join(tempDir, 'src'));
      
      // testディレクトリを作成
      fs.mkdirSync(path.join(tempDir, 'test'));
      
      const validationWithFiles: any = await (BootstrapCommand as any).validateProjectStructure();
      expect(validationWithFiles.warnings.length).toBe(0);
    });
  });

  describe('統合テスト', () => {
    test('完全なブートストラップワークフロー（設定ファイル生成まで）', async () => {
      // package.jsonを作成（プロジェクト構造テスト用）
      fs.writeFileSync(path.join(tempDir, 'package.json'), JSON.stringify({
        name: 'test-project',
        version: '1.0.0'
      }), 'utf-8');
      
      // srcディレクトリを作成
      fs.mkdirSync(path.join(tempDir, 'src'));
      
      const bootstrap = new DictionaryBootstrap(tempDir);
      
      // 基本辞書の作成（手動セットアップのシミュレーション）
      const projectInfo = {
        domain: 'integration-test',
        language: 'typescript',
        framework: 'jest',
        projectType: 'web'
      };
      
      const dictionary: DomainDictionary = (bootstrap as any).createBasicDictionary(projectInfo);
      await (bootstrap as any).generateConfiguration(projectInfo, dictionary);
      
      // 設定とファイルの確認
      const configPath = path.join(tempDir, '.rimorrc.json');
      expect(fs.existsSync(configPath)).toBe(true);
      
      const dictionaryPath = path.join(tempDir, '.rimor', 'dictionaries', 'integration-test.yaml');
      expect(fs.existsSync(dictionaryPath)).toBe(true);
      
      // 設定ファイルの内容確認
      const config: any = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
      expect(config.project.domain).toBe('integration-test');
      expect(config.bootstrap.completed).toBe(true);
      
      // 辞書ファイルの読み込み確認
      const loadedDictionary: DomainDictionary | null = await DictionaryLoader.loadFromFile(dictionaryPath);
      expect(loadedDictionary).toBeDefined();
      expect(loadedDictionary!.domain).toBe('integration-test');
      expect(loadedDictionary!.terms.length).toBeGreaterThan(0);
      
      bootstrap.close();
    });

    test('ステータス → 検証の一連の流れ', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      // 初期ステータス（設定なし）
      await BootstrapCommand.executeStatus();
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('❌ セットアップ未完了'));
      
      // 設定を作成
      const configPath = path.join(tempDir, '.rimorrc.json');
      const dictionaryDir = path.join(tempDir, '.rimor', 'dictionaries');
      
      fs.writeFileSync(configPath, JSON.stringify({
        version: '1.0.0',
        project: { domain: 'test' },
        dictionary: { enabled: true }
      }), 'utf-8');
      
      fs.mkdirSync(dictionaryDir, { recursive: true });
      fs.writeFileSync(path.join(dictionaryDir, 'test.yaml'), 'terms: []\nbusinessRules: []', 'utf-8');
      
      consoleSpy.mockClear();
      
      // 設定後ステータス
      await BootstrapCommand.executeStatus();
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('✅ セットアップ完了'));
      
      consoleSpy.mockClear();
      
      // 検証実行
      await BootstrapCommand.executeValidate();
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('✅ エラーなし'));
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('✅ 良好'));
      
      consoleSpy.mockRestore();
    });
  });
});