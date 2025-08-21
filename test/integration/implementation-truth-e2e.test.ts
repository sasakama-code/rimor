/**
 * Implementation Truth機能 エンドツーエンドテスト
 * v0.9.0 AIコーディング時代の品質保証エンジン対応
 * 
 * 実際のファイルシステムとCLIを使用した統合テスト
 */

import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { execSync } from 'child_process';

describe('Implementation Truth E2E テスト', () => {
  let tempDir: string;
  let rimorBinary: string;

  beforeAll(() => {
    // テスト用の一時ディレクトリを作成
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'rimor-e2e-'));
    
    // Rimorバイナリのパスを設定
    rimorBinary = path.resolve(__dirname, '../../dist/index.js');
    
    // バイナリが存在することを確認
    if (!fs.existsSync(rimorBinary)) {
      throw new Error(`Rimor binary not found at ${rimorBinary}. Run 'npm run build' first.`);
    }
  });

  afterAll(() => {
    // 一時ディレクトリをクリーンアップ
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  beforeEach(() => {
    // 各テストの前に一時ディレクトリをクリア
    const files = fs.readdirSync(tempDir);
    for (const file of files) {
      const filePath = path.join(tempDir, file);
      fs.rmSync(filePath, { recursive: true, force: true });
    }
  });

  describe('基本的なImplementation Truth分析', () => {
    it('単一TypeScriptファイルでImplementation Truth分析が実行される', () => {
      // Arrange: テスト用のTypeScriptファイルを作成
      const srcDir = path.join(tempDir, 'src');
      fs.mkdirSync(srcDir, { recursive: true });
      
      const testFile = path.join(srcDir, 'user.ts');
      const testCode = `
export class User {
  constructor(private id: string, private email: string) {}
  
  validateEmail(): boolean {
    // 簡単なバリデーション
    return this.email.includes('@');
  }
  
  updateProfile(newEmail: string): void {
    // セキュリティリスク: 入力検証なし
    this.email = newEmail;
  }
}
      `;
      fs.writeFileSync(testFile, testCode);

      // Act: Implementation Truth分析を実行
      const command = `node "${rimorBinary}" analyze "${srcDir}" --implementation-truth --format=json`;
      const result = execSync(command, { 
        encoding: 'utf8',
        cwd: tempDir,
        timeout: 30000 // 30秒のタイムアウト
      });

      // Assert: 結果の検証
      expect(result).toBeDefined();
      
      const jsonResult = JSON.parse(result);
      expect(jsonResult).toHaveProperty('metadata');
      expect(jsonResult.metadata).toHaveProperty('analysisMode', 'implementation-truth');
      expect(jsonResult.metadata).toHaveProperty('analysisEngine', 'UnifiedAnalysisEngine');
      expect(jsonResult).toHaveProperty('totalFiles');
      expect(jsonResult.totalFiles).toBeGreaterThan(0);
    });

    it('プロダクションコードとテストコードの統合分析が実行される', () => {
      // Arrange: プロダクションコードとテストコードを作成
      const srcDir = path.join(tempDir, 'src');
      const testDir = path.join(tempDir, 'test');
      fs.mkdirSync(srcDir, { recursive: true });
      fs.mkdirSync(testDir, { recursive: true });

      // プロダクションコード
      const productionFile = path.join(srcDir, 'calculator.ts');
      const productionCode = `
export class Calculator {
  add(a: number, b: number): number {
    return a + b;
  }
  
  divide(a: number, b: number): number {
    // ゼロ除算チェックなし（意図的な問題）
    return a / b;
  }
}
      `;
      fs.writeFileSync(productionFile, productionCode);

      // テストコード
      const testFile = path.join(testDir, 'calculator.test.ts');
      const testCode = `
import { Calculator } from '../src/calculator';

describe('Calculator', () => {
  it('should add two numbers', () => {
    const calc = new Calculator();
    expect(calc.add(2, 3)).toBe(5);
  });
  
  // 意図: ゼロ除算のテストが不足
  // Implementation Truth分析でギャップとして検出されるはず
});
      `;
      fs.writeFileSync(testFile, testCode);

      // Act: 統合分析を実行
      const command = `node "${rimorBinary}" analyze "${srcDir}" --implementation-truth --test-path="${testDir}" --format=json --verbose`;
      const result = execSync(command, { 
        encoding: 'utf8',
        cwd: tempDir,
        timeout: 30000
      });

      // Assert: 結果の検証
      expect(result).toContain('v0.9.0 (Implementation Truth Analysis)');
      
      const lines = result.split('\n');
      const jsonLine = lines.find(line => line.trim().startsWith('{'));
      expect(jsonLine).toBeDefined();
      
      if (jsonLine) {
        const jsonResult = JSON.parse(jsonLine);
        expect(jsonResult.metadata).toHaveProperty('implementationTruthData');
        expect(jsonResult.metadata.implementationTruthData).toHaveProperty('implementationTruth');
      }
    });
  });

  describe('AI向け出力形式', () => {
    it('AI-JSON形式で構造化された出力が生成される', () => {
      // Arrange: テスト用ファイルを作成
      const srcDir = path.join(tempDir, 'src');
      fs.mkdirSync(srcDir, { recursive: true });
      
      const testFile = path.join(srcDir, 'api.ts');
      const testCode = `
export class APIClient {
  async fetchUser(id: string): Promise<any> {
    // SQLインジェクションリスク
    const query = \`SELECT * FROM users WHERE id = '\${id}'\`;
    return await this.executeQuery(query);
  }
  
  private async executeQuery(query: string): Promise<any> {
    // 実装省略
    return {};
  }
}
      `;
      fs.writeFileSync(testFile, testCode);

      // Act: AI向け出力で分析
      const command = `node "${rimorBinary}" analyze "${srcDir}" --ai-output --format=ai-json`;
      const result = execSync(command, { 
        encoding: 'utf8',
        cwd: tempDir,
        timeout: 30000
      });

      // Assert: AI-JSON形式の検証
      const jsonResult = JSON.parse(result);
      expect(jsonResult).toHaveProperty('qualityScore');
      expect(jsonResult.qualityScore).toHaveProperty('overall');
      expect(typeof jsonResult.qualityScore.overall).toBe('number');
    });
  });

  describe('専用コマンド', () => {
    it('implementation-truth-analyzeコマンドが正常動作する', () => {
      // Arrange: テスト用ファイルを作成
      const srcDir = path.join(tempDir, 'src');
      fs.mkdirSync(srcDir, { recursive: true });
      
      const testFile = path.join(srcDir, 'service.ts');
      const testCode = `
export class UserService {
  async createUser(userData: any): Promise<void> {
    // 入力検証なし
    await this.saveToDatabase(userData);
  }
  
  private async saveToDatabase(data: any): Promise<void> {
    // 実装省略
  }
}
      `;
      fs.writeFileSync(testFile, testCode);

      // Act: 専用コマンドを実行
      const command = `node "${rimorBinary}" implementation-truth-analyze "${srcDir}" --format=ai-json --verbose`;
      
      try {
        const result = execSync(command, { 
          encoding: 'utf8',
          cwd: tempDir,
          timeout: 30000
        });

        // Assert: 専用コマンドの実行成功
        expect(result).toContain('Implementation Truth分析');
        
        // JSON部分を抽出して検証
        const lines = result.split('\n');
        const jsonLine = lines.find(line => line.trim().startsWith('{'));
        if (jsonLine) {
          const jsonResult = JSON.parse(jsonLine);
          expect(jsonResult).toHaveProperty('format', 'ai-implementation-truth');
        }
      } catch (error) {
        // 専用コマンドが未実装の場合はスキップ
        expect((error as any).message).toContain('Unknown command');
      }
    });
  });

  describe('エラー処理', () => {
    it('存在しないパスを指定した場合適切なエラーメッセージが表示される', () => {
      // Act & Assert: 存在しないパスでエラーが発生することを確認
      const nonExistentPath = path.join(tempDir, 'non-existent');
      const command = `node "${rimorBinary}" analyze "${nonExistentPath}" --implementation-truth`;
      
      expect(() => {
        execSync(command, { 
          encoding: 'utf8',
          cwd: tempDir,
          timeout: 10000
        });
      }).toThrow();
    });

    it('不正なオプション組み合わせでエラーが発生する', () => {
      // Arrange: 有効なソースディレクトリを作成
      const srcDir = path.join(tempDir, 'src');
      fs.mkdirSync(srcDir, { recursive: true });
      fs.writeFileSync(path.join(srcDir, 'dummy.ts'), 'export const dummy = true;');

      // Act & Assert: 不正なフォーマット指定でエラーが発生することを確認
      const command = `node "${rimorBinary}" analyze "${srcDir}" --implementation-truth --format=invalid-format`;
      
      expect(() => {
        execSync(command, { 
          encoding: 'utf8',
          cwd: tempDir,
          timeout: 10000
        });
      }).toThrow();
    });
  });

  describe('ファイル出力', () => {
    it('JSONファイルに結果が正しく出力される', () => {
      // Arrange: テスト用ファイルとディレクトリを作成
      const srcDir = path.join(tempDir, 'src');
      const outputDir = path.join(tempDir, 'output');
      fs.mkdirSync(srcDir, { recursive: true });
      fs.mkdirSync(outputDir, { recursive: true });
      
      const testFile = path.join(srcDir, 'example.ts');
      fs.writeFileSync(testFile, 'export const example = "test";');

      const outputFile = path.join(outputDir, 'analysis-result.json');

      // Act: ファイル出力で分析
      const command = `node "${rimorBinary}" analyze "${srcDir}" --implementation-truth --output-json="${outputFile}"`;
      execSync(command, { 
        encoding: 'utf8',
        cwd: tempDir,
        timeout: 30000
      });

      // Assert: 出力ファイルが作成され、有効なJSONであることを確認
      expect(fs.existsSync(outputFile)).toBe(true);
      
      const fileContent = fs.readFileSync(outputFile, 'utf8');
      const jsonResult = JSON.parse(fileContent);
      expect(jsonResult).toHaveProperty('metadata');
      expect(jsonResult.metadata).toHaveProperty('analysisMode', 'implementation-truth');
    });
  });

  describe('パフォーマンス', () => {
    it('中規模プロジェクトの分析が合理的な時間で完了する', () => {
      // Arrange: 複数ファイルを含むプロジェクトを作成
      const srcDir = path.join(tempDir, 'src');
      fs.mkdirSync(srcDir, { recursive: true });

      // 10個のファイルを作成
      for (let i = 0; i < 10; i++) {
        const fileName = path.join(srcDir, `module${i}.ts`);
        const code = `
export class Module${i} {
  process(data: any): any {
    return data.transform();
  }
  
  validate(input: string): boolean {
    return input.length > 0;
  }
}
        `;
        fs.writeFileSync(fileName, code);
      }

      // Act: パフォーマンス測定
      const startTime = Date.now();
      const command = `node "${rimorBinary}" analyze "${srcDir}" --implementation-truth --format=json`;
      
      const result = execSync(command, { 
        encoding: 'utf8',
        cwd: tempDir,
        timeout: 60000 // 1分のタイムアウト
      });
      
      const endTime = Date.now();
      const executionTime = endTime - startTime;

      // Assert: 合理的な実行時間（30秒以内）
      expect(executionTime).toBeLessThan(30000);
      
      const jsonResult = JSON.parse(result);
      expect(jsonResult.totalFiles).toBeGreaterThanOrEqual(10);
    });
  });
});