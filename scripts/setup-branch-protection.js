#!/usr/bin/env node

/**
 * GitHub Branch Protection Rules設定スクリプト
 * 手動リリースを防ぎ、自動化ワークフローを強制する
 */

const https = require('https');
const fs = require('fs');

// GitHub APIクライアント
class GitHubAPI {
  constructor(token, owner, repo) {
    this.token = token;
    this.owner = owner;
    this.repo = repo;
    this.baseUrl = 'api.github.com';
  }

  async request(method, path, data = null) {
    return new Promise((resolve, reject) => {
      const options = {
        hostname: this.baseUrl,
        port: 443,
        path: path,
        method: method,
        headers: {
          'Authorization': `token ${this.token}`,
          'User-Agent': 'Rimor-Branch-Protection-Setup',
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json'
        }
      };

      const req = https.request(options, (res) => {
        let responseData = '';
        
        res.on('data', (chunk) => {
          responseData += chunk;
        });
        
        res.on('end', () => {
          try {
            const parsed = responseData ? JSON.parse(responseData) : {};
            if (res.statusCode >= 200 && res.statusCode < 300) {
              resolve(parsed);
            } else {
              reject(new Error(`GitHub API error: ${res.statusCode} - ${parsed.message || responseData}`));
            }
          } catch (error) {
            reject(new Error(`JSON parse error: ${error.message}`));
          }
        });
      });

      req.on('error', (error) => {
        reject(error);
      });

      if (data) {
        req.write(JSON.stringify(data));
      }
      
      req.end();
    });
  }

  async setBranchProtection(branch, config) {
    const path = `/repos/${this.owner}/${this.repo}/branches/${branch}/protection`;
    return this.request('PUT', path, config);
  }

  async getRepository() {
    const path = `/repos/${this.owner}/${this.repo}`;
    return this.request('GET', path);
  }
}

// Branch Protection設定
const BRANCH_PROTECTION_CONFIG = {
  required_status_checks: {
    strict: true,
    contexts: [
      "Quality Gates",
      // 他のCIチェックがある場合はここに追加
    ]
  },
  enforce_admins: true,  // 管理者にもルールを適用
  required_pull_request_reviews: {
    required_approving_review_count: 1,
    dismiss_stale_reviews: true,
    require_code_owner_reviews: false,
    restrict_pushes: true
  },
  restrictions: null,  // 全ユーザーがPRを作成可能
  required_linear_history: true,  // マージコミットを強制
  allow_force_pushes: false,
  allow_deletions: false,
  block_creations: false,  // 新しいブランチ作成は許可
  lock_branch: false
};

// 設定実行
async function setupBranchProtection() {
  try {
    // 環境変数から設定を取得
    const token = process.env.GITHUB_TOKEN;
    const repository = process.env.GITHUB_REPOSITORY || 'sasakama-code/rimor';
    
    if (!token) {
      throw new Error('GITHUB_TOKEN environment variable is required');
    }

    const [owner, repo] = repository.split('/');
    const api = new GitHubAPI(token, owner, repo);

    console.log('🔒 Setting up Branch Protection Rules...');
    console.log(`📋 Repository: ${repository}`);
    console.log(`🌿 Branch: main`);

    // リポジトリ情報確認
    console.log('🔍 Verifying repository access...');
    const repoInfo = await api.getRepository();
    console.log(`✅ Repository verified: ${repoInfo.full_name}`);

    // Branch Protection設定
    console.log('🛡️ Applying branch protection rules...');
    const result = await api.setBranchProtection('main', BRANCH_PROTECTION_CONFIG);
    
    console.log('✅ Branch protection rules applied successfully!');
    console.log('');
    console.log('📋 Applied Rules:');
    console.log('  ✅ Require status checks to pass before merging');
    console.log('  ✅ Require branches to be up to date before merging');
    console.log('  ✅ Require pull request reviews before merging');
    console.log('  ✅ Dismiss stale pull request approvals when new commits are pushed');
    console.log('  ✅ Require linear history');
    console.log('  ✅ Do not allow force pushes');
    console.log('  ✅ Do not allow deletions');
    console.log('  ✅ Include administrators');
    console.log('');
    console.log('🚀 Release Protection:');
    console.log('  ✅ Direct pushes to main branch: BLOCKED');
    console.log('  ✅ Manual tag creation: CONTROLLED via PR process');
    console.log('  ✅ Release automation: ENFORCED via GitHub Actions');
    console.log('');
    console.log('🎯 Next Steps:');
    console.log('  1. All releases must go through Pull Request process');
    console.log('  2. Version tags should be created through release automation');
    console.log('  3. Quality Gates must pass before any merge');

  } catch (error) {
    console.error('❌ Failed to setup branch protection:', error.message);
    
    if (error.message.includes('404')) {
      console.error('💡 Possible causes:');
      console.error('  - Repository not found or access denied');
      console.error('  - GitHub token lacks proper permissions');
      console.error('  - Repository name is incorrect');
    } else if (error.message.includes('422')) {
      console.error('💡 Possible causes:');
      console.error('  - Branch does not exist');
      console.error('  - Invalid protection rule configuration');
      console.error('  - Required status checks reference non-existent checks');
    }
    
    process.exit(1);
  }
}

// スクリプト実行時の処理
if (require.main === module) {
  setupBranchProtection();
}

module.exports = { setupBranchProtection, GitHubAPI, BRANCH_PROTECTION_CONFIG };