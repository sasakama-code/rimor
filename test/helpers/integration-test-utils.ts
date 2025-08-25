/**
 * 統合テスト用ヘルパーユーティリティ
 * モックに依存しない実際のファイルシステムを使用したテストをサポート
 */

import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

/**
 * 一時プロジェクトディレクトリを作成
 * @param prefix ディレクトリ名のプレフィックス
 * @returns 作成されたディレクトリのパス
 */
export function createTempProject(prefix: string = 'test-project-'): string {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), prefix));
  return tempDir;
}

/**
 * テストファイルを作成
 * @param projectDir プロジェクトディレクトリ
 * @param relativePath ファイルの相対パス
 * @param content ファイルの内容
 */
export function createTestFile(projectDir: string, relativePath: string, content: string): void {
  const fullPath = path.join(projectDir, relativePath);
  const dir = path.dirname(fullPath);
  
  // ディレクトリが存在しない場合は作成
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  
  fs.writeFileSync(fullPath, content, 'utf-8');
}

/**
 * 一時プロジェクトをクリーンアップ
 * @param projectDir クリーンアップするディレクトリ
 */
export function cleanupTempProject(projectDir: string): void {
  if (fs.existsSync(projectDir)) {
    fs.rmSync(projectDir, { recursive: true, force: true });
  }
}

/**
 * package.jsonを作成
 * @param projectDir プロジェクトディレクトリ
 * @param dependencies 依存関係
 * @param devDependencies 開発依存関係
 */
export function createPackageJson(
  projectDir: string,
  dependencies: Record<string, string> = {},
  devDependencies: Record<string, string> = {}
): void {
  const packageJson = {
    name: 'test-project',
    version: '1.0.0',
    dependencies,
    devDependencies
  };
  
  createTestFile(projectDir, 'package.json', JSON.stringify(packageJson, null, 2));
}

/**
 * TypeScriptプロジェクトの基本構造を作成
 * @param projectDir プロジェクトディレクトリ
 */
export function createTypeScriptProject(projectDir: string): void {
  // tsconfig.json
  const tsConfig = {
    compilerOptions: {
      target: 'ES2020',
      module: 'commonjs',
      lib: ['ES2020'],
      outDir: './dist',
      rootDir: './src',
      strict: true,
      esModuleInterop: true,
      skipLibCheck: true,
      forceConsistentCasingInFileNames: true
    },
    include: ['src/**/*'],
    exclude: ['node_modules', 'dist']
  };
  
  createTestFile(projectDir, 'tsconfig.json', JSON.stringify(tsConfig, null, 2));
  
  // srcディレクトリを作成
  fs.mkdirSync(path.join(projectDir, 'src'), { recursive: true });
}

/**
 * テスト用のTypeScriptファイルを生成
 * @param projectDir プロジェクトディレクトリ
 * @param fileName ファイル名
 * @param imports インポート文の配列
 * @param code コード本体
 */
export function createTypeScriptFile(
  projectDir: string,
  fileName: string,
  imports: string[] = [],
  code: string = ''
): void {
  const importStatements = imports.join('\n');
  const content = `${importStatements}${importStatements ? '\n\n' : ''}${code}`;
  createTestFile(projectDir, fileName, content);
}

/**
 * JavaScriptファイルを生成
 * @param projectDir プロジェクトディレクトリ
 * @param fileName ファイル名
 * @param requires require文の配列
 * @param code コード本体
 */
export function createJavaScriptFile(
  projectDir: string,
  fileName: string,
  requires: string[] = [],
  code: string = ''
): void {
  const requireStatements = requires.join('\n');
  const content = `${requireStatements}${requireStatements ? '\n\n' : ''}${code}`;
  createTestFile(projectDir, fileName, content);
}

/**
 * テスト用のクラスコードを生成（God Objectパターン）
 */
export function createGodObjectCode(): string {
  return `
export class ApplicationManager {
  private database: Database;
  private logger: Logger;
  private auth: AuthService;
  private email: EmailService;
  private cache: CacheService;
  private queue: QueueService;
  private analytics: AnalyticsService;
  private config: ConfigService;
  private notification: NotificationService;
  private payment: PaymentService;
  
  constructor() {
    this.database = new Database();
    this.logger = new Logger();
    this.auth = new AuthService();
    this.email = new EmailService();
    this.cache = new CacheService();
    this.queue = new QueueService();
    this.analytics = new AnalyticsService();
    this.config = new ConfigService();
    this.notification = new NotificationService();
    this.payment = new PaymentService();
  }
  
  connectDatabase() { return this.database.connect(); }
  disconnectDatabase() { return this.database.disconnect(); }
  queryDatabase(sql: string) { return this.database.query(sql); }
  
  logMessage(msg: string) { this.logger.log(msg); }
  logError(err: Error) { this.logger.error(err); }
  logWarning(warn: string) { this.logger.warn(warn); }
  
  authenticateUser(username: string, password: string) { 
    return this.auth.authenticate(username, password); 
  }
  authorizeUser(userId: string, resource: string) { 
    return this.auth.authorize(userId, resource); 
  }
  createSession(userId: string) { return this.auth.createSession(userId); }
  
  sendEmail(to: string, subject: string, body: string) { 
    return this.email.send(to, subject, body); 
  }
  queueEmail(email: EmailData) { return this.queue.add(email); }
  
  cacheData(key: string, value: any) { this.cache.set(key, value); }
  getCachedData(key: string) { return this.cache.get(key); }
  clearCache() { this.cache.clear(); }
  
  trackEvent(event: string, data: any) { this.analytics.track(event, data); }
  generateReport(type: string) { return this.analytics.report(type); }
  
  getConfig(key: string) { return this.config.get(key); }
  setConfig(key: string, value: any) { this.config.set(key, value); }
  
  sendNotification(userId: string, message: string) { 
    return this.notification.send(userId, message); 
  }
  
  processPayment(amount: number, method: string) { 
    return this.payment.process(amount, method); 
  }
  refundPayment(transactionId: string) { 
    return this.payment.refund(transactionId); 
  }
}
`;
}

/**
 * テスト用のスパゲッティコードを生成
 */
export function createSpaghettiCode(): string {
  return `
function processData(data: any) {
  if (data) {
    if (data.type === 'A') {
      if (data.value > 10) {
        if (data.flag) {
          for (let i = 0; i < data.items.length; i++) {
            if (data.items[i].valid) {
              for (let j = 0; j < data.items[i].subitems.length; j++) {
                if (data.items[i].subitems[j].active) {
                  for (let k = 0; k < data.items[i].subitems[j].elements.length; k++) {
                    if (data.items[i].subitems[j].elements[k].enabled) {
                      // 深くネストされた処理
                      console.log('Processing element:', data.items[i].subitems[j].elements[k]);
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }
}
`;
}

/**
 * プロジェクトディレクトリ内のすべてのファイルを取得
 * @param projectDir プロジェクトディレクトリ
 * @param extensions 対象の拡張子
 */
export function getAllFiles(projectDir: string, extensions: string[] = ['.ts', '.js', '.tsx', '.jsx']): string[] {
  const files: string[] = [];
  
  function walk(dir: string) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      
      if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
        walk(fullPath);
      } else if (entry.isFile() && extensions.some(ext => entry.name.endsWith(ext))) {
        files.push(fullPath);
      }
    }
  }
  
  walk(projectDir);
  return files;
}