import * as fs from 'fs';
import * as path from 'path';
import { BootstrapCommand } from '../../../src/cli/commands/bootstrap';
import { DictionaryBootstrap } from '../../../src/cli/bootstrap/DictionaryBootstrap';
import { errorHandler } from '../../../src/utils/errorHandler';

// モック設定
jest.mock('fs');
jest.mock('path');
jest.mock('../../../src/cli/bootstrap/DictionaryBootstrap');
jest.mock('../../../src/utils/errorHandler');

const mockFs = fs as jest.Mocked<typeof fs>;
const mockPath = path as jest.Mocked<typeof path>;
const mockErrorHandler = errorHandler as jest.Mocked<typeof errorHandler>;

describe('BootstrapCommand', () => {
  let mockDictionaryBootstrap: any;
  let processExitSpy: jest.SpyInstance;
  let consoleSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // DictionaryBootstrapのモック
    mockDictionaryBootstrap = {
      runBootstrap: jest.fn()
    };
    (DictionaryBootstrap as jest.MockedClass<typeof DictionaryBootstrap>)
      .mockImplementation(() => mockDictionaryBootstrap);
    
    // pathのモック
    mockPath.join.mockImplementation((...args) => args.join('/'));
    
    // process.cwd()のモック
    jest.spyOn(process, 'cwd').mockReturnValue('/test/project');
    
    // process.exitのモック
    processExitSpy = jest.spyOn(process, 'exit').mockImplementation();
    
    // consoleのモック
    consoleSpy = jest.spyOn(console, 'log').mockImplementation();
  });

  afterEach(() => {
    processExitSpy.mockRestore();
    consoleSpy.mockRestore();
  });

  describe('executeInit', () => {
    test('基本的な初期化が実行される', async () => {
      jest.spyOn(BootstrapCommand as any, 'hasExistingSetup').mockResolvedValue(false);
      
      await BootstrapCommand.executeInit();
      
      expect(DictionaryBootstrap).toHaveBeenCalled();
      expect(mockDictionaryBootstrap.runBootstrap).toHaveBeenCalled();
    });

    test('既存設定がある場合、forceオプションなしでは実行されない', async () => {
      jest.spyOn(BootstrapCommand as any, 'hasExistingSetup').mockResolvedValue(true);
      
      await BootstrapCommand.executeInit({ force: false });
      
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('既存の設定が見つかりました'));
      expect(DictionaryBootstrap).not.toHaveBeenCalled();
    });

    test('既存設定があってもforceオプションで実行される', async () => {
      jest.spyOn(BootstrapCommand as any, 'hasExistingSetup').mockResolvedValue(true);
      
      await BootstrapCommand.executeInit({ force: true });
      
      expect(DictionaryBootstrap).toHaveBeenCalled();
      expect(mockDictionaryBootstrap.runBootstrap).toHaveBeenCalled();
    });

    test('autoオプションで自動初期化が実行される', async () => {
      jest.spyOn(BootstrapCommand as any, 'hasExistingSetup').mockResolvedValue(false);
      jest.spyOn(BootstrapCommand as any, 'executeAutoInit').mockResolvedValue(undefined);
      
      await BootstrapCommand.executeInit({ auto: true });
      
      expect(BootstrapCommand as any).toHaveProperty('executeAutoInit');
      expect(DictionaryBootstrap).not.toHaveBeenCalled();
    });

    test('エラーが発生した場合、適切にハンドリングされる', async () => {
      const testError = new Error('Init failed');
      jest.spyOn(BootstrapCommand as any, 'hasExistingSetup').mockRejectedValue(testError);
      
      await BootstrapCommand.executeInit();
      
      expect(mockErrorHandler.handleError).toHaveBeenCalledWith(
        testError,
        expect.any(String),
        'ブートストラップ初期化に失敗しました'
      );
      expect(processExitSpy).toHaveBeenCalledWith(1);
    });
  });

  describe('executeStatus', () => {
    test('設定ファイルが存在する場合の状況表示', async () => {
      const mockConfig = {
        project: {
          domain: 'test-domain',
          language: 'typescript'
        },
        dictionary: {
          enabled: true
        }
      };
      
      mockFs.existsSync.mockImplementation((filePath) => {
        return filePath.toString().includes('.rimorrc.json');
      });
      mockFs.readFileSync.mockReturnValue(JSON.stringify(mockConfig));
      
      await BootstrapCommand.executeStatus();
      
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('📊 Rimor セットアップ状況'));
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('✅ 存在'));
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('test-domain'));
    });

    test('辞書ディレクトリが存在する場合の状況表示', async () => {
      mockFs.existsSync.mockImplementation((filePath) => {
        return filePath.toString().includes('dictionaries');
      });
      mockFs.readdirSync.mockReturnValue(['test.yaml', 'other.yml'] as any);
      mockFs.statSync.mockReturnValue({ size: 1024 } as any);
      
      await BootstrapCommand.executeStatus();
      
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('辞書ファイル数: 2'));
    });

    test('セットアップが未完了の場合の表示', async () => {
      mockFs.existsSync.mockReturnValue(false);
      
      await BootstrapCommand.executeStatus();
      
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('❌ セットアップ未完了'));
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('rimor bootstrap init'));
    });

    test('設定ファイルの読み込みエラーが適切に処理される', async () => {
      mockFs.existsSync.mockImplementation((filePath) => {
        return filePath.toString().includes('.rimorrc.json');
      });
      mockFs.readFileSync.mockImplementation(() => {
        throw new Error('File read error');
      });
      
      await BootstrapCommand.executeStatus();
      
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('設定ファイルの読み込みに失敗'));
    });

    test('エラーが発生した場合、エラーハンドラーが呼ばれる', async () => {
      const testError = new Error('Status check failed');
      jest.spyOn(process, 'cwd').mockImplementation(() => {
        throw testError;
      });
      
      await BootstrapCommand.executeStatus();
      
      expect(mockErrorHandler.handleError).toHaveBeenCalledWith(
        testError,
        expect.any(String),
        'ステータス確認に失敗しました'
      );
    });
  });

  describe('executeValidate', () => {
    test('検証が正常に完了する', async () => {
      jest.spyOn(BootstrapCommand as any, 'validateConfiguration').mockResolvedValue({
        errors: [],
        warnings: []
      });
      jest.spyOn(BootstrapCommand as any, 'validateDictionaries').mockResolvedValue({
        errors: [],
        warnings: []
      });
      jest.spyOn(BootstrapCommand as any, 'validateProjectStructure').mockResolvedValue({
        errors: [],
        warnings: []
      });
      
      await BootstrapCommand.executeValidate();
      
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('🔍 Rimor セットアップの検証を開始'));
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('✅ エラーなし'));
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('✅ 良好'));
    });

    test('エラーがある場合の表示', async () => {
      jest.spyOn(BootstrapCommand as any, 'validateConfiguration').mockResolvedValue({
        errors: ['設定エラー'],
        warnings: []
      });
      jest.spyOn(BootstrapCommand as any, 'validateDictionaries').mockResolvedValue({
        errors: ['辞書エラー'],
        warnings: []
      });
      jest.spyOn(BootstrapCommand as any, 'validateProjectStructure').mockResolvedValue({
        errors: [],
        warnings: []
      });
      
      await BootstrapCommand.executeValidate();
      
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('❌ エラー: 2件'));
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('❌ 要修正'));
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('修正方法'));
    });

    test('警告がある場合の表示', async () => {
      jest.spyOn(BootstrapCommand as any, 'validateConfiguration').mockResolvedValue({
        errors: [],
        warnings: ['設定警告']
      });
      jest.spyOn(BootstrapCommand as any, 'validateDictionaries').mockResolvedValue({
        errors: [],
        warnings: ['辞書警告']
      });
      jest.spyOn(BootstrapCommand as any, 'validateProjectStructure').mockResolvedValue({
        errors: [],
        warnings: []
      });
      
      await BootstrapCommand.executeValidate();
      
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('⚠️  警告: 2件'));
    });
  });

  describe('executeClean', () => {
    test('confirmオプションなしでは実行されない', async () => {
      await BootstrapCommand.executeClean();
      
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('⚠️  この操作により以下が削除されます'));
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('--confirm オプションを追加'));
      expect(mockFs.unlinkSync).not.toHaveBeenCalled();
    });

    test('confirmオプションでクリーンアップが実行される', async () => {
      mockFs.existsSync.mockReturnValue(true);
      
      await BootstrapCommand.executeClean({ confirm: true });
      
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('🧹 Rimor セットアップのクリーンアップを開始'));
      expect(mockFs.unlinkSync).toHaveBeenCalled();
      expect(mockFs.rmSync).toHaveBeenCalled();
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('✅ クリーンアップが完了'));
    });

    test('削除対象がない場合の表示', async () => {
      mockFs.existsSync.mockReturnValue(false);
      
      await BootstrapCommand.executeClean({ confirm: true });
      
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('削除対象のファイルが見つかりませんでした'));
    });

    test('クリーンアップ中のエラーが適切に処理される', async () => {
      const testError = new Error('Clean failed');
      mockFs.existsSync.mockImplementation(() => {
        throw testError;
      });
      
      await BootstrapCommand.executeClean({ confirm: true });
      
      expect(mockErrorHandler.handleError).toHaveBeenCalledWith(
        testError,
        expect.any(String),
        'クリーンアップに失敗しました'
      );
    });
  });

  describe('hasExistingSetup', () => {
    test('設定ファイルが存在する場合trueを返す', async () => {
      mockFs.existsSync.mockImplementation((filePath) => {
        return filePath.toString().includes('.rimorrc.json');
      });
      
      const result = await (BootstrapCommand as any).hasExistingSetup();
      expect(result).toBe(true);
    });

    test('辞書ディレクトリに辞書がある場合trueを返す', async () => {
      mockFs.existsSync.mockImplementation((filePath) => {
        return filePath.toString().includes('dictionaries');
      });
      mockFs.readdirSync.mockReturnValue(['test.yaml'] as any);
      
      const result = await (BootstrapCommand as any).hasExistingSetup();
      expect(result).toBe(true);
    });

    test('何も存在しない場合falseを返す', async () => {
      mockFs.existsSync.mockReturnValue(false);
      mockFs.readdirSync.mockReturnValue([] as any);
      
      const result = await (BootstrapCommand as any).hasExistingSetup();
      expect(result).toBe(false);
    });
  });

  describe('executeAutoInit', () => {
    test('自動初期化のメッセージが表示される', async () => {
      await (BootstrapCommand as any).executeAutoInit({ template: 'basic' });
      
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('🤖 自動モードでセットアップを実行'));
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('テンプレート "basic" を使用'));
    });

    test('ドメインオプションが適用される', async () => {
      await (BootstrapCommand as any).executeAutoInit({ domain: 'custom-domain' });
      
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('自動モードでセットアップを実行'));
    });
  });

  describe('validateConfiguration', () => {
    test('設定ファイルが存在しない場合エラーを返す', async () => {
      mockFs.existsSync.mockReturnValue(false);
      
      const result = await (BootstrapCommand as any).validateConfiguration();
      
      expect(result.errors).toContain('設定ファイル (.rimorrc.json) が見つかりません');
    });

    test('正常な設定ファイルの場合エラーなし', async () => {
      const mockConfig = {
        version: '1.0.0',
        project: {
          domain: 'test'
        },
        dictionary: {
          enabled: true
        }
      };
      
      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockReturnValue(JSON.stringify(mockConfig));
      
      const result = await (BootstrapCommand as any).validateConfiguration();
      
      expect(result.errors).toHaveLength(0);
    });

    test('必須フィールドが不足している場合の警告・エラー', async () => {
      const mockConfig = {
        project: {}
      };
      
      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockReturnValue(JSON.stringify(mockConfig));
      
      const result = await (BootstrapCommand as any).validateConfiguration();
      
      expect(result.warnings).toContain('設定ファイルにversionフィールドがありません');
      expect(result.errors).toContain('プロジェクトドメインが設定されていません');
    });

    test('不正なJSONの場合エラーを返す', async () => {
      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockReturnValue('invalid json');
      
      const result = await (BootstrapCommand as any).validateConfiguration();
      
      expect(result.errors).toContain('設定ファイルの形式が不正です');
    });
  });

  describe('validateDictionaries', () => {
    test('辞書ディレクトリが存在しない場合エラーを返す', async () => {
      mockFs.existsSync.mockReturnValue(false);
      
      const result = await (BootstrapCommand as any).validateDictionaries();
      
      expect(result.errors).toContain('辞書ディレクトリが見つかりません');
    });

    test('辞書ファイルがない場合警告を返す', async () => {
      mockFs.existsSync.mockReturnValue(true);
      mockFs.readdirSync.mockReturnValue([] as any);
      
      const result = await (BootstrapCommand as any).validateDictionaries();
      
      expect(result.warnings).toContain('辞書ファイルが見つかりません');
    });

    test('空の辞書ファイルでエラーを返す', async () => {
      mockFs.existsSync.mockReturnValue(true);
      mockFs.readdirSync.mockReturnValue(['empty.yaml'] as any);
      mockFs.statSync.mockReturnValue({ size: 0 } as any);
      
      const result = await (BootstrapCommand as any).validateDictionaries();
      
      expect(result.errors).toContain('辞書ファイル empty.yaml が空です');
    });

    test('正常な辞書ファイルの場合エラーなし', async () => {
      mockFs.existsSync.mockReturnValue(true);
      mockFs.readdirSync.mockReturnValue(['valid.yaml'] as any);
      mockFs.statSync.mockReturnValue({ size: 1024 } as any);
      mockFs.readFileSync.mockReturnValue('terms:\n  - id: test');
      
      const result = await (BootstrapCommand as any).validateDictionaries();
      
      expect(result.errors).toHaveLength(0);
    });

    test('標準構造がない辞書ファイルで警告', async () => {
      mockFs.existsSync.mockReturnValue(true);
      mockFs.readdirSync.mockReturnValue(['invalid-structure.yaml'] as any);
      mockFs.statSync.mockReturnValue({ size: 1024 } as any);
      mockFs.readFileSync.mockReturnValue('invalid yaml content');
      
      const result = await (BootstrapCommand as any).validateDictionaries();
      
      expect(result.warnings).toContain(
        expect.stringContaining('標準的な構造が見つかりません')
      );
    });
  });

  describe('validateProjectStructure', () => {
    test('package.jsonがない場合の警告', async () => {
      mockFs.existsSync.mockImplementation((filePath) => {
        return !filePath.toString().includes('package.json');
      });
      
      const result = await (BootstrapCommand as any).validateProjectStructure();
      
      expect(result.warnings).toContain(
        expect.stringContaining('package.jsonが見つかりません')
      );
    });

    test('srcディレクトリがない場合の警告', async () => {
      mockFs.existsSync.mockImplementation((filePath) => {
        const filePathStr = filePath.toString();
        return filePathStr.includes('package.json') && !filePathStr.includes('/src');
      });
      
      const result = await (BootstrapCommand as any).validateProjectStructure();
      
      expect(result.warnings).toContain('srcディレクトリが見つかりません');
    });

    test('テストディレクトリがない場合の警告', async () => {
      mockFs.existsSync.mockImplementation((filePath) => {
        const filePathStr = filePath.toString();
        return filePathStr.includes('package.json') || filePathStr.includes('/src');
      });
      
      const result = await (BootstrapCommand as any).validateProjectStructure();
      
      expect(result.warnings).toContain('テストディレクトリが見つかりません');
    });

    test('完全な構造の場合警告なし', async () => {
      mockFs.existsSync.mockReturnValue(true);
      
      const result = await (BootstrapCommand as any).validateProjectStructure();
      
      expect(result.warnings).toHaveLength(0);
      expect(result.errors).toHaveLength(0);
    });
  });
});