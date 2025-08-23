/**
 * CIシャード設定の整合性テスト
 * Issue #91対応のためのテスト
 */
import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';

describe('CI Shard Configuration', () => {
  const projectRoot = path.resolve(__dirname, '../..');
  const packageJsonPath = path.join(projectRoot, 'package.json');
  const ciOptimizedPath = path.join(projectRoot, '.github/workflows/ci-optimized.yml');

  let packageJson: any;
  let ciOptimizedConfig: any;

  beforeAll(() => {
    // package.json読み込み
    const packageJsonContent = fs.readFileSync(packageJsonPath, 'utf8');
    packageJson = JSON.parse(packageJsonContent);

    // ci-optimized.yml読み込み
    const ciOptimizedContent = fs.readFileSync(ciOptimizedPath, 'utf8');
    ciOptimizedConfig = yaml.load(ciOptimizedContent);
  });

  describe('Package.json Shard Scripts', () => {
    it('should have defined test:shard scripts', () => {
      const scripts = packageJson.scripts;
      expect(scripts).toBeDefined();
      
      // 現在定義されているシャードスクリプトを確認
      const shardScripts = Object.keys(scripts).filter(key => key.startsWith('test:shard'));
      expect(shardScripts.length).toBeGreaterThan(0);
    });

    it('should have consistent shard numbers across scripts', () => {
      const scripts = packageJson.scripts;
      const shardScripts = Object.keys(scripts).filter(key => key.match(/^test:shard\d+$/));
      
      // 連続した番号を持つかチェック
      const shardNumbers = shardScripts.map(script => 
        parseInt(script.replace('test:shard', ''))
      ).sort((a, b) => a - b);
      
      expect(shardNumbers.length).toBeGreaterThan(0);
      
      for (let i = 0; i < shardNumbers.length; i++) {
        expect(shardNumbers[i]).toBe(i + 1);
      }
    });

    it('should have consistent shard configuration in each script', () => {
      const scripts = packageJson.scripts;
      const shardScripts = Object.keys(scripts).filter(key => key.match(/^test:shard\d+$/));
      
      shardScripts.forEach(scriptName => {
        const scriptContent = scripts[scriptName];
        expect(scriptContent).toContain('jest');
        expect(scriptContent).toContain('--shard=');
        expect(scriptContent).toContain('--config=config/jest/jest.config.mjs');
      });
    });
  });

  describe('CI Optimized Workflow Configuration', () => {
    it('should have shard matrix defined', () => {
      const testJob = ciOptimizedConfig.jobs['parallel-tests'];
      expect(testJob).toBeDefined();
      expect(testJob.strategy).toBeDefined();
      expect(testJob.strategy.matrix).toBeDefined();
      expect(testJob.strategy.matrix.shard).toBeDefined();
      expect(Array.isArray(testJob.strategy.matrix.shard)).toBe(true);
    });

    it('should have consistent shard numbers with package.json', () => {
      // package.jsonのシャードスクリプト数を取得
      const scripts = packageJson.scripts;
      const shardScripts = Object.keys(scripts).filter(key => key.match(/^test:shard\d+$/));
      const packageShardCount = shardScripts.length;

      // CIのシャードマトリックスを取得
      const testJob = ciOptimizedConfig.jobs['parallel-tests'];
      const ciShardArray = testJob.strategy.matrix.shard;
      const ciShardCount = ciShardArray.length;
      const maxCiShard = Math.max(...ciShardArray);

      // 修正後はpackage.jsonのシャード数とCIの最大シャード数が一致する
      expect(packageShardCount).toBe(maxCiShard);
    });

    it('should use npm run test:shard command instead of npm test --shard', () => {
      const testJob = ciOptimizedConfig.jobs['parallel-tests'];
      const runStep = testJob.steps.find((step: any) => 
        step.name && step.name.includes('Run tests')
      );
      
      expect(runStep).toBeDefined();
      expect(runStep.run).toBeDefined();
      
      // 修正後は 'npm run test:shard' を使用する
      expect(runStep.run).toContain('npm run test:shard');
    });
  });

  describe('Shard Execution Validation', () => {
    it('should validate that all shard scripts are executable', () => {
      const scripts = packageJson.scripts;
      const shardScripts = Object.keys(scripts).filter(key => key.match(/^test:shard\d+$/));
      
      shardScripts.forEach(scriptName => {
        const scriptContent = scripts[scriptName];
        
        // shardスクリプトの必須要素をチェック
        expect(scriptContent).toContain('NODE_OPTIONS=');
        expect(scriptContent).toContain('jest');
        expect(scriptContent).toContain('--shard=');
        expect(scriptContent).toContain('--forceExit');
        expect(scriptContent).toContain('--runInBand');
      });
    });

    it('should validate shard distribution is correct', () => {
      const scripts = packageJson.scripts;
      const shardScripts = Object.keys(scripts).filter(key => key.match(/^test:shard\d+$/));
      const totalShards = shardScripts.length;
      
      shardScripts.forEach((scriptName, index) => {
        const scriptContent = scripts[scriptName];
        const expectedShardPattern = `--shard=${index + 1}/${totalShards}`;
        expect(scriptContent).toContain(expectedShardPattern);
      });
    });
  });

  describe('Environment Configuration', () => {
    it('should have consistent NODE_OPTIONS across shard scripts', () => {
      const scripts = packageJson.scripts;
      const shardScripts = Object.keys(scripts).filter(key => key.match(/^test:shard\d+$/));
      
      const nodeOptionsRegex = /NODE_OPTIONS="([^"]+)"/;
      const nodeOptionsList = shardScripts.map(scriptName => {
        const scriptContent = scripts[scriptName];
        const match = scriptContent.match(nodeOptionsRegex);
        return match ? match[1] : null;
      });
      
      // 全てのシャードで同じNODE_OPTIONSを使用することを確認
      const uniqueNodeOptions = [...new Set(nodeOptionsList)];
      expect(uniqueNodeOptions.length).toBe(1);
      expect(uniqueNodeOptions[0]).toContain('--max-old-space-size=');
    });
  });
});