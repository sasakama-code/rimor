/**
 * domain-analyze End-to-End Test
 * v0.9.0 - CLIコマンドの統合テスト
 * 
 * TDD: RED段階 - バグを再現するテストから開始
 */

import { execSync } from 'child_process';
import * as fs from 'fs/promises';
import * as path from 'path';

describe('domain-analyze E2E Test', () => {
  const testProjectPath = path.join(__dirname, '../fixtures/e2e-test-project');
  const outputDir = path.join(testProjectPath, '.rimor');
  const domainFile = path.join(outputDir, 'domain.json');
  const cliPath = path.join(__dirname, '../../dist/index.js');

  beforeAll(async () => {
    // テストプロジェクトディレクトリを作成
    await fs.mkdir(testProjectPath, { recursive: true });
    
    // テスト用のソースファイルを作成
    const testFiles = [
      {
        path: path.join(testProjectPath, 'user.ts'),
        content: `
          export class User {
            constructor(
              public id: string,
              public name: string,
              public email: string
            ) {}
            
            login(password: string): boolean {
              // authentication logic
              return true;
            }
          }
        `
      },
      {
        path: path.join(testProjectPath, 'payment.ts'),
        content: `
          export class Payment {
            constructor(
              public amount: number,
              public currency: string
            ) {}
            
            processTransaction(): void {
              // payment processing logic
            }
          }
        `
      },
      {
        path: path.join(testProjectPath, 'order.ts'),
        content: `
          import { User } from './user';
          import { Payment } from './payment';
          
          export class Order {
            constructor(
              public user: User,
              public items: any[],
              public payment: Payment
            ) {}
            
            checkout(): void {
              // checkout logic
            }
          }
        `
      }
    ];
    
    for (const file of testFiles) {
      await fs.writeFile(file.path, file.content);
    }
  });

  afterAll(async () => {
    // テストプロジェクトディレクトリをクリーンアップ
    await fs.rm(testProjectPath, { recursive: true, force: true });
  });

  beforeEach(async () => {
    // 出力ディレクトリをクリーンアップ
    await fs.rm(outputDir, { recursive: true, force: true });
  });

  describe('基本的な実行', () => {
    it('デフォルトオプションでdomain-analyzeコマンドを実行できる', () => {
      const command = `node ${cliPath} domain-analyze ${testProjectPath} --interactive=false`;
      
      expect(() => {
        execSync(command, { encoding: 'utf-8' });
      }).not.toThrow();
    });

    it('JSON形式で出力できる', () => {
      const command = `node ${cliPath} domain-analyze ${testProjectPath} --format=json --interactive=false`;
      const output = execSync(command, { encoding: 'utf-8' });
      
      expect(() => JSON.parse(output)).not.toThrow();
      const result = JSON.parse(output);
      expect(result).toHaveProperty('domains');
      expect(result).toHaveProperty('project');
    });

    it('ドメイン定義ファイルが作成される', async () => {
      const command = `node ${cliPath} domain-analyze ${testProjectPath} --interactive=false`;
      execSync(command, { encoding: 'utf-8' });
      
      const fileExists = await fs.access(domainFile).then(() => true).catch(() => false);
      expect(fileExists).toBe(true);
    });
  });

  describe('オプション処理', () => {
    it('除外パターンを指定できる', () => {
      const command = `node ${cliPath} domain-analyze ${testProjectPath} --exclude=test,spec --interactive=false`;
      
      expect(() => {
        execSync(command, { encoding: 'utf-8' });
      }).not.toThrow();
    });

    it('空の除外パターンを処理できる', () => {
      const command = `node ${cliPath} domain-analyze ${testProjectPath} --exclude= --interactive=false`;
      
      expect(() => {
        execSync(command, { encoding: 'utf-8' });
      }).not.toThrow();
    });

    it('最大クラスタ数を指定できる', () => {
      const command = `node ${cliPath} domain-analyze ${testProjectPath} --max-clusters=10 --interactive=false`;
      
      expect(() => {
        execSync(command, { encoding: 'utf-8' });
      }).not.toThrow();
    });

    it('最小キーワード頻度を指定できる', () => {
      const command = `node ${cliPath} domain-analyze ${testProjectPath} --min-keyword-frequency=5 --interactive=false`;
      
      expect(() => {
        execSync(command, { encoding: 'utf-8' });
      }).not.toThrow();
    });

    it('複数のオプションを組み合わせて実行できる', () => {
      const command = `node ${cliPath} domain-analyze ${testProjectPath} --format=json --max-clusters=3 --min-keyword-frequency=1 --exclude=test --interactive=false`;
      
      expect(() => {
        const output = execSync(command, { encoding: 'utf-8' });
        const result = JSON.parse(output);
        expect(result).toHaveProperty('domains');
        expect(result).toHaveProperty('project');
      }).not.toThrow();
    });
  });

  describe('検証モード', () => {
    it('ドメイン定義を検証できる', async () => {
      // まずドメイン定義を作成
      const createCommand = `node ${cliPath} domain-analyze ${testProjectPath} --interactive=false`;
      execSync(createCommand, { encoding: 'utf-8' });
      
      // 検証を実行
      const verifyCommand = `node ${cliPath} domain-analyze ${testProjectPath} --verify`;
      const output = execSync(verifyCommand, { encoding: 'utf-8' });
      
      expect(output).toContain('検証成功');
    });
  });

  describe('エラーハンドリング', () => {
    it('存在しないディレクトリを指定した場合エラーメッセージを表示する', () => {
      const command = `node ${cliPath} domain-analyze /non/existent/path --interactive=false`;
      
      expect(() => {
        execSync(command, { encoding: 'utf-8', stdio: 'pipe' });
      }).toThrow();
    });

    it('不正なパスを検出する', () => {
      const command = `node ${cliPath} domain-analyze ../../../etc/passwd --interactive=false`;
      
      expect(() => {
        execSync(command, { encoding: 'utf-8', stdio: 'pipe' });
      }).toThrow();
    });
  });

  describe('Phase統合テスト', () => {
    it('全Phase（1-6）が正しく統合されている', async () => {
      const command = `node ${cliPath} domain-analyze ${testProjectPath} --verbose --interactive=false`;
      const output = execSync(command, { encoding: 'utf-8' });
      
      // Phase 1: ファイル収集
      expect(output).toContain('ドメイン分析を開始');
      
      // Phase 2: 多言語キーワード抽出（ドメインが検出される）
      expect(output).toContain('ドメインクラスタを検出');
      
      // Phase 6: 整合性ハッシュ生成
      expect(output).toContain('整合性ハッシュ');
      
      // ドメインファイルが作成されている
      const fileExists = await fs.access(domainFile).then(() => true).catch(() => false);
      expect(fileExists).toBe(true);
      
      // ドメインファイルの内容を検証
      const domainContent = await fs.readFile(domainFile, 'utf-8');
      const domainData = JSON.parse(domainContent);
      
      expect(domainData).toHaveProperty('version');
      expect(domainData).toHaveProperty('project');
      expect(domainData).toHaveProperty('domains');
      expect(domainData).toHaveProperty('integrity');
      expect(domainData.integrity).toHaveProperty('hash');
      expect(domainData.integrity.hash).not.toBe('');
    });
  });
});