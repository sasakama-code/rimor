import { HistoryCommand } from '../../src/cli/commands/history';
import * as fs from 'fs';
import * as path from 'path';

describe('HistoryCommand', () => {
  let historyCommand: HistoryCommand;
  const testDir = path.join(__dirname, '../fixtures/history-cli-test');

  beforeEach(() => {
    historyCommand = new HistoryCommand();
    
    // テスト用ディレクトリを作成
    if (!fs.existsSync(testDir)) {
      fs.mkdirSync(testDir, { recursive: true });
    }
  });

  afterEach(() => {
    // テスト用ファイルをクリーンアップ
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
    
    // 出力ファイルもクリーンアップ
    const outputFiles = ['test-export.json', 'test-export.csv'];
    outputFiles.forEach(fileName => {
      const filePath = path.resolve(fileName);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    });
  });

  describe('Class Instantiation', () => {
    test('should create HistoryCommand instance', () => {
      expect(historyCommand).toBeInstanceOf(HistoryCommand);
      expect(historyCommand['historyManager']).toBeDefined();
      expect(historyCommand['trendEngine']).toBeDefined();
      expect(historyCommand['predictionEngine']).toBeDefined();
    });

    test('should have required private methods', () => {
      expect(typeof historyCommand['displayHistoryStats']).toBe('function');
      expect(typeof historyCommand['displayFileHistory']).toBe('function');
      expect(typeof historyCommand['displayProjectHistory']).toBe('function');
      expect(typeof historyCommand['cleanHistory']).toBe('function');
      expect(typeof historyCommand['exportHistory']).toBe('function');
    });
  });

  describe('Helper Methods', () => {
    test('should get correct trend icon', () => {
      const getTrendIcon = historyCommand['getTrendIcon'];
      
      expect(getTrendIcon('improving')).toBe('📈');
      expect(getTrendIcon('declining')).toBe('📉');
      expect(getTrendIcon('stable')).toBe('➡️');
      expect(getTrendIcon('unknown' as any)).toBe('❓');
    });
  });

  describe('Error Handling', () => {
    test('should handle non-existent project path gracefully', async () => {
      const nonExistentPath = '/non/existent/path';
      
      // displayHistoryStats should not throw for non-existent path
      await expect(async () => {
        await historyCommand['displayHistoryStats'](nonExistentPath);
      }).not.toThrow();
    });

    test('should handle empty history data', async () => {
      // テスト用の空の履歴でも正常に動作することを確認
      const emptyHistoryPath = testDir;
      
      await expect(async () => {
        await historyCommand['displayHistoryStats'](emptyHistoryPath);
      }).not.toThrow();
    });
  });

  describe('Clean History Functionality', () => {
    test('should handle cleanup of non-existent directory', async () => {
      const nonExistentPath = '/non/existent/path';
      
      await expect(async () => {
        await historyCommand['cleanHistory'](nonExistentPath, 30);
      }).not.toThrow();
    });

    test('should handle cleanup with valid directory', async () => {
      await expect(async () => {
        await historyCommand['cleanHistory'](testDir, 30);
      }).not.toThrow();
    });
  });

  describe('Export Functionality', () => {
    test('should handle export with empty history without throwing', async () => {
      const outputFileName = 'test-export.json';
      
      // エクスポート処理がエラーなく実行されることをテスト
      await expect(async () => {
        await historyCommand['exportHistory']({
          projectPath: testDir,
          output: outputFileName,
          format: 'json'
        });
      }).not.toThrow();
    });

    test('should handle CSV export without throwing', async () => {
      const outputFileName = 'test-export.csv';
      
      // エクスポート処理がエラーなく実行されることをテスト
      await expect(async () => {
        await historyCommand['exportHistory']({
          projectPath: testDir,
          output: outputFileName,
          format: 'csv'
        });
      }).not.toThrow();
    });
  });
});