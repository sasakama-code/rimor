const { exec } = require('child_process');
const path = require('path');

describe('GitHub Workflows YAML Validation', () => {
  const workflowPath = path.join(__dirname, '../.github/workflows/auto-release.yml');
  
  /**
   * YAMLLintを使用したYAML構文検証テスト
   */
  test('auto-release.yml should pass yamllint validation', (done) => {
    exec(`yamllint "${workflowPath}"`, (error, stdout, stderr) => {
      if (error) {
        console.error(`YAMLLint error: ${stderr}`);
        done(error);
        return;
      }
      console.log(`YAMLLint output: ${stdout}`);
      done();
    });
  }, 10000);

  /**
   * YAML読み込みテスト - 基本的な構文チェック
   */
  test('auto-release.yml should be valid YAML', () => {
    const fs = require('fs');
    const yaml = require('yaml');
    
    const workflowContent = fs.readFileSync(workflowPath, 'utf8');
    
    expect(() => {
      yaml.parse(workflowContent);
    }).not.toThrow();
  });

  /**
   * git commitメッセージの構文検証
   * コロンを含む複数行メッセージがYAML内で正しく処理されるかテスト
   */
  test('git commit message should not break YAML parsing', () => {
    const fs = require('fs');
    const yaml = require('yaml');
    
    const workflowContent = fs.readFileSync(workflowPath, 'utf8');
    
    // YAML解析を実行
    let parsedWorkflow;
    expect(() => {
      parsedWorkflow = yaml.parse(workflowContent);
    }).not.toThrow();

    // create-release jobが存在することを確認
    expect(parsedWorkflow.jobs).toBeDefined();
    expect(parsedWorkflow.jobs['create-release']).toBeDefined();
    
    // Update package.json and commit ステップが存在することを確認
    const steps = parsedWorkflow.jobs['create-release'].steps;
    const commitStep = steps.find(step => step.name === 'Update package.json and commit');
    
    expect(commitStep).toBeDefined();
    expect(commitStep.run).toBeDefined();
    expect(typeof commitStep.run).toBe('string');
  });
});