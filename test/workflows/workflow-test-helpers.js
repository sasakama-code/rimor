const { exec } = require('child_process');
const fs = require('fs');
const yaml = require('yaml');

/**
 * GitHub Actionsワークフローテスト用共通ヘルパー関数集
 * DRY原則に従って重複コードを排除
 */

/**
 * YAMLファイル読み込みヘルパー
 * @param {string} filePath - YAMLファイルのパス
 * @returns {string} ファイル内容
 */
function readWorkflowFile(filePath) {
  return fs.readFileSync(filePath, 'utf8');
}

/**
 * YAML解析ヘルパー
 * @param {string} content - YAML内容
 * @returns {object} 解析されたYAMLオブジェクト
 */
function parseWorkflowYaml(content) {
  return yaml.parse(content);
}

/**
 * YAML構文検証ヘルパー
 * @param {string} filePath - YAMLファイルのパス
 * @returns {void} 構文エラーがある場合は例外をスロー
 */
function validateYamlSyntax(filePath) {
  const content = readWorkflowFile(filePath);
  return () => {
    yaml.parse(content);
  };
}

/**
 * 末尾スペース検証ヘルパー
 * @param {string} filePath - YAMLファイルのパス
 * @returns {number[]} 末尾スペースがある行番号の配列
 */
function findTrailingSpaces(filePath) {
  const content = readWorkflowFile(filePath);
  const lines = content.split('\n');
  const linesWithTrailingSpaces = [];
  
  lines.forEach((line, index) => {
    if (line !== line.trimEnd()) {
      linesWithTrailingSpaces.push(index + 1);
    }
  });
  
  return linesWithTrailingSpaces;
}

/**
 * GitHub Actionsアクションバージョン検証ヘルパー
 * @param {string} filePath - YAMLファイルのパス
 * @param {string} actionName - アクション名（例: "upload-artifact"）
 * @param {string} expectedVersion - 期待するバージョン（例: "v4"）
 * @returns {string[]} 実際に見つかったアクションの配列
 */
function validateActionVersions(filePath, actionName, expectedVersion) {
  const content = readWorkflowFile(filePath);
  const regex = new RegExp(`actions/${actionName}@v\\d+`, 'g');
  const matches = content.match(regex) || [];
  
  return matches;
}

/**
 * yamllint検証ヘルパー（Promise版）
 * @param {string} filePath - YAMLファイルのパス
 * @returns {Promise<{success: boolean, stdout: string, stderr: string}>}
 */
function runYamllint(filePath) {
  return new Promise((resolve) => {
    exec(`yamllint "${filePath}"`, (error, stdout, stderr) => {
      if (error && error.code === 127) {
        // yamllintがインストールされていない場合
        resolve({
          success: true,
          stdout: 'yamllint not installed, skipping validation',
          stderr: '',
          skipped: true
        });
        return;
      }
      
      resolve({
        success: !error,
        stdout: stdout,
        stderr: stderr,
        error: error
      });
    });
  });
}

/**
 * ワークフロー構造検証ヘルパー
 * @param {string} filePath - YAMLファイルのパス
 * @param {object} expectedStructure - 期待する構造の定義
 * @returns {object} 解析されたワークフロー
 */
function validateWorkflowStructure(filePath, expectedStructure = {}) {
  const content = readWorkflowFile(filePath);
  const parsedWorkflow = parseWorkflowYaml(content);
  
  // 基本構造の検証
  if (expectedStructure.name) {
    expect(parsedWorkflow.name).toBe(expectedStructure.name);
  }
  
  if (expectedStructure.jobs) {
    expect(parsedWorkflow.jobs).toBeDefined();
    
    expectedStructure.jobs.forEach(jobName => {
      expect(parsedWorkflow.jobs[jobName]).toBeDefined();
    });
  }
  
  return parsedWorkflow;
}

/**
 * 複数アクションバージョンの一括検証
 * @param {string} filePath - YAMLファイルのパス
 * @param {object} actionVersionMap - アクション名と期待バージョンのマップ
 * @returns {object} 検証結果
 */
function validateMultipleActionVersions(filePath, actionVersionMap) {
  const results = {};
  
  Object.entries(actionVersionMap).forEach(([actionName, expectedVersion]) => {
    const actualVersions = validateActionVersions(filePath, actionName, expectedVersion);
    results[actionName] = {
      expected: `actions/${actionName}@${expectedVersion}`,
      actual: actualVersions,
      isValid: actualVersions.every(version => version === `actions/${actionName}@${expectedVersion}`)
    };
  });
  
  return results;
}

module.exports = {
  readWorkflowFile,
  parseWorkflowYaml,
  validateYamlSyntax,
  findTrailingSpaces,
  validateActionVersions,
  runYamllint,
  validateWorkflowStructure,
  validateMultipleActionVersions
};