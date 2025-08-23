/**
 * AnalyzeCommand Implementation Truth統合テスト
 * 実際のコンポーネント連携を検証
 */

import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { AnalyzeCommand, AnalyzeOptions } from '../../../src/cli/commands/analyze';

describe('AnalyzeCommand - Implementation Truth統合テスト', () => {
  let tempDir: string;

  beforeAll(() => {
    // テスト用の一時ディレクトリを作成
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'rimor-integration-'));
  });

  afterAll(() => {
    // 一時ディレクトリをクリーンアップ
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  beforeEach(() => {
    // console出力をモック
    jest.spyOn(console, 'log').mockImplementation();
    jest.spyOn(console, 'warn').mockImplementation();
    jest.spyOn(console, 'error').mockImplementation();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('実際のファイルシステムでの動作', () => {
    it('存在するディレクトリでImplementation Truth分析が実行される', async () => {
      // Arrange: テスト用ファイルを作成
      const srcDir = path.join(tempDir, 'src');
      fs.mkdirSync(srcDir, { recursive: true });
      
      const testFile = path.join(srcDir, 'sample.ts');
      const testCode = `
export class Sample {
  process(data: string): string {
    return data.toUpperCase();
  }
}
      `;
      fs.writeFileSync(testFile, testCode);

      // Act & Assert: エラーが発生しないことを確認
      const analyzeCommand = new AnalyzeCommand();
      const options: AnalyzeOptions = {
        path: srcDir,
        implementationTruth: true,
        verbose: false,
        format: 'json'
      };

      await expect(analyzeCommand.execute(options)).resolves.not.toThrow();
    });

    it('存在しないディレクトリでエラーが発生する', async () => {
      // Arrange
      const nonExistentPath = path.join(tempDir, 'non-existent');

      // Act & Assert
      const analyzeCommand = new AnalyzeCommand();
      const options: AnalyzeOptions = {
        path: nonExistentPath,
        implementationTruth: true,
        format: 'json'
      };

      await expect(analyzeCommand.execute(options)).rejects.toThrow();
    });
  });

  describe('JSONファイル出力', () => {
    it('Implementation Truth分析結果がJSONファイルに出力される', async () => {
      // Arrange: テスト用ファイルとディレクトリを作成
      const srcDir = path.join(tempDir, 'json-test-src');
      const outputDir = path.join(tempDir, 'json-output');
      fs.mkdirSync(srcDir, { recursive: true });
      fs.mkdirSync(outputDir, { recursive: true });
      
      const testFile = path.join(srcDir, 'user.ts');
      const testCode = `
export interface User {
  id: string;
  name: string;
}

export function createUser(name: string): User {
  return {
    id: Math.random().toString(),
    name: name
  };
}
      `;
      fs.writeFileSync(testFile, testCode);

      const outputFile = path.join(outputDir, 'analysis-result.json');

      // Act: JSONファイル出力で分析実行
      const analyzeCommand = new AnalyzeCommand();
      const options: AnalyzeOptions = {
        path: srcDir,
        implementationTruth: true,
        outputJson: outputFile,
        verbose: false
      };

      await analyzeCommand.execute(options);

      // Assert: 出力ファイルが作成され、有効なJSONであることを確認
      expect(fs.existsSync(outputFile)).toBe(true);
      
      const fileContent = fs.readFileSync(outputFile, 'utf8');
      const jsonResult = JSON.parse(fileContent);
      
      // Implementation Truth分析の特徴的な構造を検証
      expect(jsonResult).toHaveProperty('metadata');
      if (jsonResult.metadata && jsonResult.metadata.analysisMode === 'implementation-truth') {
        expect(jsonResult.metadata.analysisEngine).toBe('UnifiedAnalysisEngine');
        expect(jsonResult.metadata).toHaveProperty('implementationTruthData');
      }
    });
  });

  describe('verbose出力', () => {
    it('verboseモードで進捗情報が出力される', async () => {
      // Arrange: テスト用ファイルを作成
      const srcDir = path.join(tempDir, 'verbose-test-src');
      fs.mkdirSync(srcDir, { recursive: true });
      
      const testFile = path.join(srcDir, 'service.ts');
      const testCode = `
export class Service {
  async fetchData(): Promise<any> {
    return { status: 'ok' };
  }
}
      `;
      fs.writeFileSync(testFile, testCode);

      // Act: verbose モードで実行
      const analyzeCommand = new AnalyzeCommand();
      const options: AnalyzeOptions = {
        path: srcDir,
        implementationTruth: true,
        verbose: true,
        format: 'json'
      };

      await analyzeCommand.execute(options);

      // Assert: console.logが呼ばれたことを確認
      expect(console.log).toHaveBeenCalled();
    });
  });

  describe('テストパス指定', () => {
    it('テストパスが指定された場合の統合分析', async () => {
      // Arrange: プロダクションコードとテストコードを作成
      const srcDir = path.join(tempDir, 'testpath-src');
      const testDir = path.join(tempDir, 'testpath-test');
      fs.mkdirSync(srcDir, { recursive: true });
      fs.mkdirSync(testDir, { recursive: true });

      // プロダクションコード
      const productionFile = path.join(srcDir, 'math.ts');
      const productionCode = `
export class MathUtils {
  add(a: number, b: number): number {
    return a + b;
  }
  
  subtract(a: number, b: number): number {
    return a - b;
  }
}
      `;
      fs.writeFileSync(productionFile, productionCode);

      // テストコード
      const testFile = path.join(testDir, 'math.test.ts');
      const testCode = `
import { MathUtils } from '../testpath-src/math';

describe('MathUtils', () => {
  it('should add numbers correctly', () => {
    const math = new MathUtils();
    expect(math.add(2, 3)).toBe(5);
  });
});
      `;
      fs.writeFileSync(testFile, testCode);

      // Act: テストパス指定で分析実行
      const analyzeCommand = new AnalyzeCommand();
      const options: AnalyzeOptions = {
        path: srcDir,
        implementationTruth: true,
        testPath: testDir,
        verbose: false,
        format: 'json'
      };

      // Assert: エラーが発生しないことを確認
      await expect(analyzeCommand.execute(options)).resolves.not.toThrow();
    });
  });

  describe('フォーマット出力', () => {
    it('AI-JSON形式で出力される', async () => {
      // Arrange: テスト用ファイルを作成
      const srcDir = path.join(tempDir, 'ai-json-src');
      fs.mkdirSync(srcDir, { recursive: true });
      
      const testFile = path.join(srcDir, 'api.ts');
      const testCode = `
export class APIHandler {
  async handleRequest(request: any): Promise<any> {
    // 簡単な処理
    return { success: true, data: request };
  }
}
      `;
      fs.writeFileSync(testFile, testCode);

      // Act: AI-JSON形式で分析実行
      const analyzeCommand = new AnalyzeCommand();
      const options: AnalyzeOptions = {
        path: srcDir,
        aiOutput: true,
        format: 'ai-json',
        verbose: false
      };

      // Assert: エラーが発生しないことを確認
      await expect(analyzeCommand.execute(options)).resolves.not.toThrow();
    });
  });

  describe('エラーハンドリング', () => {
    it('不正なファイルが含まれていてもエラーハンドリングが機能する', async () => {
      // Arrange: 不正なTypeScriptファイルを作成
      const srcDir = path.join(tempDir, 'error-test-src');
      fs.mkdirSync(srcDir, { recursive: true });
      
      const invalidFile = path.join(srcDir, 'invalid.ts');
      const invalidCode = `
export class InvalidSyntax {
  // 故意に不正な構文
  method( {
    return 'incomplete'
  }
      `;
      fs.writeFileSync(invalidFile, invalidCode);

      // Act & Assert: エラーが適切にハンドリングされることを確認
      const analyzeCommand = new AnalyzeCommand();
      const options: AnalyzeOptions = {
        path: srcDir,
        implementationTruth: true,
        verbose: false,
        format: 'json'
      };

      // Implementation Truth分析がフォールバックして正常終了することを期待
      await expect(analyzeCommand.execute(options)).resolves.not.toThrow();
      
      // 警告メッセージが出力されることを確認
      expect(console.warn).toHaveBeenCalled();
    });
  });

  describe('パフォーマンス', () => {
    it('複数ファイルの分析が合理的な時間で完了する', async () => {
      // Arrange: 複数のファイルを作成
      const srcDir = path.join(tempDir, 'perf-test-src');
      fs.mkdirSync(srcDir, { recursive: true });

      // 5個のファイルを作成
      for (let i = 0; i < 5; i++) {
        const fileName = path.join(srcDir, `module${i}.ts`);
        const code = `
export class Module${i} {
  private value: number = ${i};
  
  getValue(): number {
    return this.value;
  }
  
  setValue(newValue: number): void {
    this.value = newValue;
  }
  
  calculate(input: number): number {
    return this.value * input + ${i};
  }
}
        `;
        fs.writeFileSync(fileName, code);
      }

      // Act: パフォーマンス測定
      const startTime = Date.now();
      
      const analyzeCommand = new AnalyzeCommand();
      const options: AnalyzeOptions = {
        path: srcDir,
        implementationTruth: true,
        verbose: false,
        format: 'json'
      };

      await analyzeCommand.execute(options);
      
      const endTime = Date.now();
      const executionTime = endTime - startTime;

      // Assert: 合理的な実行時間（10秒以内）
      expect(executionTime).toBeLessThan(10000);
    });
  });
});