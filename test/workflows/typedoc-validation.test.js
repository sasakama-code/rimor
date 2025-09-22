const path = require('path');
const {
  validateYamlSyntax,
  findTrailingSpaces,
  validateMultipleActionVersions,
  validateWorkflowStructure,
  runYamllint
} = require('./workflow-test-helpers');

describe('TypeDoc Workflow YAML Validation', () => {
  const workflowPath = path.join(__dirname, '../../.github/workflows/typedoc.yml');
  
  /**
   * GitHub Actionsバージョン検証テスト（Issue #96対応）
   * 
   * 要求される最新バージョン:
   * - upload-artifact@v4
   * - download-artifact@v4
   * - configure-pages@v5
   * - upload-pages-artifact@v3
   * - deploy-pages@v4
   */
  describe('GitHub Actions Version Validation', () => {
    const expectedVersions = {
      'upload-artifact': 'v4',
      'download-artifact': 'v4',
      'configure-pages': 'v5',
      'upload-pages-artifact': 'v3',
      'deploy-pages': 'v4'
    };

    test('should use latest versions for all actions', () => {
      const validationResults = validateMultipleActionVersions(workflowPath, expectedVersions);
      
      Object.entries(validationResults).forEach(([actionName, result]) => {
        expect(result.actual).toBeDefined();
        expect(result.actual.length).toBeGreaterThan(0);
        
        result.actual.forEach(actualVersion => {
          expect(actualVersion).toBe(result.expected);
        });
      });
    });
  });

  /**
   * 末尾スペース検証テスト（YAMLlintエラー対応）
   */
  describe('Trailing Spaces Validation', () => {
    test('should not have trailing spaces on any line', () => {
      const linesWithTrailingSpaces = findTrailingSpaces(workflowPath);
      expect(linesWithTrailingSpaces).toEqual([]);
    });
  });

  /**
   * YAML構文検証テスト
   */
  describe('YAML Syntax Validation', () => {
    test('typedoc.yml should be valid YAML', () => {
      expect(validateYamlSyntax(workflowPath)).not.toThrow();
    });

    test('should have required workflow structure', () => {
      const expectedStructure = {
        name: 'TypeDoc Documentation',
        jobs: ['generate-docs', 'deploy-docs']
      };
      
      expect(() => {
        validateWorkflowStructure(workflowPath, expectedStructure);
      }).not.toThrow();
    });
  });

  /**
   * YAMLlint検証テスト（yamllintがインストールされている場合）
   */
  describe('YAMLlint Validation', () => {
    test('typedoc.yml should pass yamllint validation', async () => {
      const result = await runYamllint(workflowPath);
      
      if (result.skipped) {
        console.log(result.stdout);
        return;
      }
      
      if (!result.success) {
        console.error(`YAMLLint error: ${result.stderr}`);
        throw result.error;
      }
      
      console.log(`YAMLLint output: ${result.stdout}`);
    }, 10000);
  });
});