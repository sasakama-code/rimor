/**
 * auto-release.ymlの出力検証テスト
 * Issue #92対応 - release_created出力の問題修正
 */
const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

describe('auto-release.yml Output Validation', () => {
  const workflowPath = path.join(__dirname, '../../.github/workflows/auto-release.yml');
  let workflowConfig;

  beforeAll(() => {
    const workflowContent = fs.readFileSync(workflowPath, 'utf8');
    workflowConfig = yaml.load(workflowContent);
  });

  describe('create-release job outputs', () => {
    let createReleaseJob;
    let createReleaseSteps;

    beforeAll(() => {
      createReleaseJob = workflowConfig.jobs['create-release'];
      createReleaseSteps = createReleaseJob.steps;
    });

    it('should have create-release job defined', () => {
      expect(createReleaseJob).toBeDefined();
    });

    it('should have outputs section defined', () => {
      expect(createReleaseJob.outputs).toBeDefined();
    });

    it('should have new_version output correctly defined', () => {
      expect(createReleaseJob.outputs.new_version).toBe('${{ steps.version.outputs.new_version }}');
    });

    /**
     * Issue #92の核心テスト: release_created出力の検証
     * softprops/action-gh-releaseアクションは実際にはrelease_created出力を提供しないため、
     * この出力は別の方法で設定される必要がある
     */
    it('should have release_created output that references a valid step output', () => {
      expect(createReleaseJob.outputs.release_created).toBeDefined();
      
      // release_created出力が参照しているstepを特定
      const releaseCreatedOutput = createReleaseJob.outputs.release_created;
      expect(releaseCreatedOutput).toMatch(/\$\{\{\s*steps\.[\w-]+\.outputs\.[\w_]+\s*\}\}/);
      
      // 参照されているstep IDを抽出
      const stepMatch = releaseCreatedOutput.match(/steps\.([^.]+)\.outputs/);
      expect(stepMatch).toBeTruthy();
      
      const referencedStepId = stepMatch[1];
      
      // 該当のstepが存在することを確認
      const referencedStep = createReleaseSteps.find(step => step.id === referencedStepId);
      expect(referencedStep).toBeDefined();
      
      // stepがrelease_created出力を適切に設定していることを確認
      if (referencedStepId !== 'create') {
        // softprops/action-gh-releaseではない場合、runコマンドでGITHUB_OUTPUTに設定する必要がある
        expect(referencedStep.run).toContain('release_created=true');
        expect(referencedStep.run).toContain('GITHUB_OUTPUT');
      } else {
        // Issue #92: softprops/action-gh-releaseはrelease_created出力を提供しない
        // このテストは失敗するはずで、修正が必要であることを示す
        throw new Error('softprops/action-gh-release does not provide release_created output. This needs to be fixed.');
      }
    });

    it('should have GitHub Release creation step with proper id', () => {
      const createStep = createReleaseSteps.find(step => 
        step.name === 'Create GitHub Release'
      );
      
      expect(createStep).toBeDefined();
      expect(createStep.id).toBe('create');
      expect(createStep.uses).toBe('softprops/action-gh-release@v2');
    });

    /**
     * softprops/action-gh-releaseが提供する実際の出力を確認
     * - url: リリースページのURL
     * - id: リリースID  
     * - upload_url: アセットアップロード用URL
     * - assets: アップロードされたアセットのJSON配列
     */
    it('should be able to use valid softprops/action-gh-release outputs', () => {
      const createStep = createReleaseSteps.find(step => 
        step.name === 'Create GitHub Release'
      );
      
      // これらの出力は実際に利用可能
      const validOutputs = ['url', 'id', 'upload_url', 'assets'];
      
      // テスト: これらの出力を使用したジョブ出力も定義可能であることを確認
      validOutputs.forEach(outputName => {
        const potentialOutput = `\${{ steps.create.outputs.${outputName} }}`;
        // このテストは実装ガイドとして機能し、実際の出力として使用可能であることを示す
        expect(potentialOutput).toMatch(/\$\{\{\s*steps\.create\.outputs\.\w+\s*\}\}/);
      });
    });
  });

  describe('notify-success job dependency', () => {
    let notifySuccessJob;

    beforeAll(() => {
      notifySuccessJob = workflowConfig.jobs['notify-success'];
    });

    it('should have notify-success job defined', () => {
      expect(notifySuccessJob).toBeDefined();
    });

    it('should depend on create-release job', () => {
      expect(notifySuccessJob.needs).toContain('create-release');
    });

    /**
     * Issue #92の影響確認: notify-successジョブの条件
     * 未定義のrelease_created出力を参照していないかチェック
     */
    it('should have valid condition that references existing outputs', () => {
      const condition = notifySuccessJob.if;
      expect(condition).toBeDefined();
      
      if (condition.includes('needs.create-release.outputs.release_created')) {
        // create-release jobのrelease_created出力が適切に定義されていることを確認
        const createReleaseJob = workflowConfig.jobs['create-release'];
        expect(createReleaseJob.outputs.release_created).toBeDefined();
        
        // さらに、その出力が有効なstepを参照していることを確認
        const releaseCreatedOutput = createReleaseJob.outputs.release_created;
        expect(releaseCreatedOutput).not.toBe('${{ steps.create.outputs.release_created }}');
      }
    });
  });

  describe('Overall workflow integrity', () => {
    it('should not reference non-existent action outputs', () => {
      // ワークフロー全体で、存在しない出力を参照していないかチェック
      const workflowString = JSON.stringify(workflowConfig);
      
      // softprops/action-gh-releaseが提供しない出力への参照をチェック
      const invalidPatterns = [
        'steps.create.outputs.release_created',  // Issue #92の問題
      ];
      
      invalidPatterns.forEach(pattern => {
        expect(workflowString).not.toContain(pattern);
      });
    });

    it('should have consistent job output references', () => {
      // 全てのjob間での出力参照が整合性を保っていることを確認
      Object.keys(workflowConfig.jobs).forEach(jobName => {
        const job = workflowConfig.jobs[jobName];
        
        if (job.needs && Array.isArray(job.needs)) {
          job.needs.forEach(dependency => {
            const dependencyJob = workflowConfig.jobs[dependency];
            expect(dependencyJob).toBeDefined();
          });
        }
      });
    });
  });
});